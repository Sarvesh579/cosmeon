  import "server-only"
  export const runtime="nodejs"
  import {emitMapEvent} from "@/lib/mapEvents"
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
  import {sha256} from "@/lib/fs-lite/hash"
  import {buildMerkleRoot} from "@/lib/fs-lite/merkle"
  import {ARCHITECTURE} from "@/lib/config"

  const CACHE_LIMIT=20

  export async function GET(req:NextRequest){
    const startTime = Date.now()
    await connectDB()
    const id = req.nextUrl.searchParams.get("id")
    if(!id){
      return NextResponse.json({error:"missing id"})
    }
    const file = await File.findById(id)
    if(!file){
      return NextResponse.json(
        { error: "file not found" },
        { status: 404 }
      )
    }
    const wasHot = file.isHot
    const user = await User.findById(file.userId)
    const policy = policies[process.env.CACHE_POLICY || "lru"]
    const entry = {
      fileId:file._id.toString(),
      lastAccess:Date.now(),
      frequency:file.accessCount||0,
      createdAt:file.createdAt.getTime()
    }
    policy.recordAccess(entry)
    await File.updateOne(
      { _id: file._id },
      {
        $inc: {
          accessCount: 1,
          ...(file.accessCount > 5
            ? { heatScore: 1 }
            : {})
        },
        ...(ARCHITECTURE === "cached"
          ? {
              $set: {
                cacheExpiresAt: new Date(
                  Date.now() + CACHE_TTL
                )
              }
            }
          : {})
      }
    )
    const storageNodes = await Node.find({
      storageType:"storage"
    }).lean()

    const storageIds = new Set(
      storageNodes.map(n=>n.nodeId)
    )

    // If the file is cold, warm it: replicate chunks into the L1 cache node
    if(
      ARCHITECTURE==="cached" &&
      !file.isHot
    ){
      const cacheNodeId = user?.cacheLayout?.L1
      if(cacheNodeId){
        const cacheNode = await Node.findOne({nodeId: cacheNodeId})
        if(cacheNode){
          for(const chunk of file.chunks){
            if(!chunk.nodes.includes(cacheNodeId)){
              try{
                const sourceId = chunk.nodes.find(n => storageIds.has(n))
                if(!sourceId) continue
                const data = await fetchChunk(sourceId, chunk.chunkId)
                if(data){
                  await axios.put(`${cacheNode.url}/chunk/${chunk.chunkId}`, data, {
                    headers:{"Content-Type":"application/octet-stream"}
                  })
                  await Node.updateOne({ nodeId: cacheNodeId }, { $inc: { used: data.length } })
                  await File.updateOne(
                    {
                      _id: file._id,
                      "chunks.chunkId": chunk.chunkId
                    },
                    {
                      $addToSet: {
                        "chunks.$.nodes": cacheNodeId
                      }
                    }
                  )
                }
              } catch(err){
                console.error(`Cache warming failed for chunk ${chunk.chunkId}:`, err)
              }
            }
          }
        }
      }
      
      await File.updateOne(
        {
          _id: file._id,
          isHot: false
        },
        {
          $set: {
            isHot: true
          }
        }
      )

      logEvent({
        type: "heat",
        fileId: file._id.toString(),
        filename: file.filename,
        userId: file.userId,
        size: file.size,
        latency: Date.now() - startTime // Approximate heat latency
      })
    }

    const freshFile = await File.findById(file._id)
    console.log(
      "FILE HOT:",
      freshFile?.isHot
    )

    console.log(
      freshFile?.chunks[0]?.nodes
    )

    // Convert Mongoose DocumentArray to plain array before sorting
    const chunksToProcess = [...freshFile.chunks].sort((a:any, b:any) => a.order - b.order)
    
    const buffers: Buffer[] = []
    
    // Track metrics for the final summary instead of writing to DB for every single chunk
    let totalLatency = 0
    let avgDistance = 0
    let usedNodeId = ""
    const nodeDocs = await Node.find().lean()
    const nodeMap = Object.fromEntries(
      nodeDocs.map(n => [n.nodeId, n])
    )

    for (const chunk of chunksToProcess) {
      let data = null
      const start = Date.now()

      let orderedNodes:string[]

      if(
        ARCHITECTURE==="cached" &&
        wasHot
      ){
        orderedNodes =
          chunk.nodes.filter(
            id =>
              nodeMap[id]?.storageType === "cache"
          )

        if(orderedNodes.length===0){
          orderedNodes =
            chunk.nodes.filter(
              id =>
                nodeMap[id]?.storageType === "storage"
            )
        }
      }
      else{
        orderedNodes =
          chunk.nodes.filter(
            id =>
              nodeMap[id]?.storageType === "storage"
          )
      }

      for (const nodeId of orderedNodes) {
        try {
          const node = await Node.findOne({ nodeId })
          data=await fetchChunk(
            nodeId,
            chunk.chunkId,
            ARCHITECTURE==="cached"
              ? user?.location
              : undefined
          )
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
      
      if(!data){
      logEvent({
        type:"chunk_loss",
        fileId:file._id.toString(),
        filename:file.filename,
        userId:file.userId,
        chunkId:chunk.chunkId
      })

      return NextResponse.json(
        {
          error:`Chunk ${chunk.chunkId} is unavailable`
        },
        {status:500}
      )
    }
        
      buffers.push(data)
    }

    if(buffers.length !== chunksToProcess.length){
      logEvent({
        type:"partial_loss",
        fileId:file._id.toString(),
        filename:file.filename,
        userId:file.userId,
        recovered:buffers.length,
        expected:chunksToProcess.length
      })

      return NextResponse.json(
        {error:"file incomplete"},
        {status:500}
      )
    }

    const fileBuffer = Buffer.concat(buffers)
    
    const chunkHashes = chunksToProcess.map((chunk:any)=>{
      const buffer = buffers[chunk.order]
      return sha256(buffer)
    })

    const calculatedRoot = buildMerkleRoot(chunkHashes)
    const totalTime = Date.now() - startTime
    const downloadSpeed = fileBuffer.length / (totalTime / 1000)

    if(calculatedRoot !== file.rootHash){
      logEvent({
        type:"verify_failed",
        fileId:file._id.toString(),
        filename:file.filename,
        userId:file.userId
      })
      console.error(
        `Merkle verification failed for ${file.filename}`
      )
      return NextResponse.json(
        {error:"file integrity verification failed"},
        {status:500}
      )
    }
    
    logEvent({
      type:"verify",
      fileId:file._id.toString(),
      filename:file.filename,
      userId:file.userId
    })
    
    // Save aggregate metrics in the background
    await CacheMetrics.create({
      operation:"download",
      architecture:ARCHITECTURE,
      cachePolicy:policy.name.toLowerCase(),
      coldOrHot:wasHot ? "hot" : "cold",
      fileId:file._id.toString(),
      userId:file.userId,
      hit:wasHot,
      cacheLevel:wasHot ? "L1" : "STORAGE",
      latency:totalLatency/chunksToProcess.length,
      endToendLatency:totalTime,
      distance:avgDistance/chunksToProcess.length,
      nodeId:usedNodeId,
      chunkCount:chunksToProcess.length,
      fileSize:fileBuffer.length,
      speed:downloadSpeed,
      replicaCount:3,
      verificationPassed:true
    }).catch(e => console.error("Metrics error:", e))

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