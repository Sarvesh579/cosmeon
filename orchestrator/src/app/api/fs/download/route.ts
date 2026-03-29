import "server-only"
export const runtime="nodejs"

import {NextRequest,NextResponse} from "next/server"
import {connectDB} from "@/lib/db"
import File from "@/models/File"
import {fetchChunk} from "@/lib/fs-lite/fetchChunk"
import {policies} from "@/lib/cache/cacheManager"
import CacheMetrics from "@/models/CacheMetrics"
import User from "@/models/User"
import Node from "@/models/Node"
import {distance} from "@/lib/distance"

const CACHE_LIMIT=20

export async function GET(req:NextRequest){
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
  const sorted=file.chunks.sort((a:any,b:any)=>a.order-b.order)
  const buffers:Buffer[]=[]
  for(const chunk of sorted){
    let data
    let usedNode=null
    let nodeDistance=0
    const start=Date.now()
    for(const nodeId of chunk.nodes){
      try{
        const node=await Node.findOne({nodeId})
        data=await fetchChunk(nodeId,chunk.chunkId,user?.location)
        if(data){
          usedNode=nodeId
          if(user?.location && node?.location){
            nodeDistance=distance(user.location,node.location)
          }
          break
        }
      }catch{}
    }
    const latency=Date.now()-start
    if(!data){
      throw new Error("chunk unavailable")
    }
    await CacheMetrics.create({
      policy:policy.name,
      fileId:file._id,
      userId:file.userId,
      nodeId:usedNode,
      latency,
      distance:nodeDistance,
      hit:true
    })
    buffers.push(data)
  }
  const fileBuffer=Buffer.concat(buffers)
  return new NextResponse(fileBuffer,{
    headers:{
      "Content-Type":"application/octet-stream",
      "Content-Disposition":`attachment; filename="${file.filename}"`
    }
  })
}