import "server-only"
export const runtime="nodejs"

import {NextRequest,NextResponse} from "next/server"
import {connectDB} from "@/lib/db"
import File from "@/models/File"
import {fetchChunk} from "@/lib/fs-lite/fetchChunk"
import {policies, CACHE_TTL} from "@/lib/cache/cacheManager"
import CacheMetrics from "@/models/CacheMetrics"
import User from "@/models/User"
import Node from "@/models/Node"
import {distance} from "@/lib/distance"
import axios from "axios"
import { logEvent } from "@/lib/analytics"

const CACHE_LIMIT=20

export async function GET(req:NextRequest){
  const startTime = Date.now()
  await connectDB()
  const id=req.nextUrl.searchParams.get("id")
  if(!id){
    return NextResponse.json({error:"missing id"})
  }
  const file=await File.findById(id)
  if(!file){
    return NextResponse.json({error:"file not found"})
  }
  const user=await User.findById(file.userId)
  const policy=policies[process.env.CACHE_POLICY||"lru"]
  const entry={
    fileId:file._id.toString(),
    lastAccess:Date.now(),
    frequency:file.accessCount||0,
    createdAt:file.createdAt.getTime()
  }
  policy.recordAccess(entry)
  file.accessCount+=1
  if(file.accessCount>5){
    file.heatScore+=1
  }

  // If the file is cold, warm it: replicate chunks into the L1 cache node
  if(!file.isHot){
    const cacheNodeId = user?.cacheLayout?.L1
    if(cacheNodeId){
      const cacheNode = await Node.findOne({nodeId: cacheNodeId})
      if(cacheNode){
        for(const chunk of file.chunks){
          if(!chunk.nodes.includes(cacheNodeId)){
            try{
              const sourceId = chunk.nodes[0]
              const data = await fetchChunk(sourceId, chunk.chunkId)
              if(data){
                await axios.put(`${cacheNode.url}/chunk/${chunk.chunkId}`, data, {
                  headers:{"Content-Type":"application/octet-stream"}
                })
                await Node.updateOne({ nodeId: cacheNodeId }, { $inc: { used: data.length } })
                chunk.nodes.push(cacheNodeId)
              }
            } catch(err){
              console.error(`Cache warming failed for chunk ${chunk.chunkId}:`, err)
            }
          }
        }
      }
    }
    file.isHot = true
    logEvent({
      type: "heat",
      fileId: file._id.toString(),
      filename: file.filename,
      userId: file.userId,
      size: file.size,
      latency: Date.now() - startTime // Approximate heat latency
    })
  }

  // Reset/extend the cache TTL on every access
  file.cacheExpiresAt = new Date(Date.now() + CACHE_TTL)
  await file.save()

  const hotFiles=await File.find().sort({heatScore:-1}).limit(CACHE_LIMIT)
  if(hotFiles.length>=CACHE_LIMIT){
    const entries=hotFiles.map(f=>({
      fileId:f._id.toString(),
      lastAccess:f.updatedAt?.getTime()||Date.now(),
      frequency:f.accessCount||0,
      createdAt:f.createdAt.getTime()
    }))
    const victim=policy.chooseEviction(entries)
    await File.updateOne({_id:victim},{$set:{heatScore:0}})
  }
  // Convert Mongoose DocumentArray to plain array before sorting
  const chunksToProcess = [...file.chunks].sort((a:any, b:any) => a.order - b.order)
  
  const buffers: Buffer[] = []
  
  // Track metrics for the final summary instead of writing to DB for every single chunk
  let totalLatency = 0
  let avgDistance = 0
  let usedNodeId = ""

  for (const chunk of chunksToProcess) {
    let data = null
    const start = Date.now()
    
    for (const nodeId of chunk.nodes) {
      try {
        const node = await Node.findOne({ nodeId })
        data = await fetchChunk(nodeId, chunk.chunkId, user?.location)
        if (data) {
          usedNodeId = nodeId
          if (user?.location && node?.location) {
            avgDistance += distance(user.location, node.location)
          }
          break
        }
      } catch (err) {
        console.error(`Error fetching chunk ${chunk.chunkId} from ${nodeId}:`, err)
      }
    }

    totalLatency += (Date.now() - start)
    
    if (!data) {
      return NextResponse.json({ error: `Chunk ${chunk.chunkId} is unavailable` }, { status: 500 })
    }
    
    buffers.push(data)
  }

  const fileBuffer = Buffer.concat(buffers)

  // Save aggregate metrics in the background
  CacheMetrics.create({
    policy: policy.name,
    fileId: file._id,
    userId: file.userId,
    nodeId: usedNodeId,
    latency: totalLatency / chunksToProcess.length,
    distance: avgDistance / chunksToProcess.length,
    hit: true
  }).catch(e => console.error("Metrics error:", e))

  const totalTime = Date.now() - startTime
  const downloadSpeed = fileBuffer.length / (totalTime / 1000)

  logEvent({
    type: "download",
    fileId: file._id.toString(),
    filename: file.filename,
    userId: file.userId,
    size: fileBuffer.length,
    latency: totalTime,
    speed: downloadSpeed
  })

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Content-Length": fileBuffer.length.toString()
    }
  })
}