import {NextRequest,NextResponse} from "next/server"
import {contentDefinedChunk} from "@/lib/fs-lite/chunker"
import {sha256} from "@/lib/fs-lite/hash"
import {sendChunkReplicated} from "@/lib/fs-lite/distribute"
import {buildMerkleRoot} from "@/lib/fs-lite/merkle"
import {connectDB} from "@/lib/db"
import Analytics from "@/models/Analytics"
import { logEvent } from "@/lib/analytics"
import File from "@/models/File"
import CacheMetrics from "@/models/CacheMetrics"
import {ARCHITECTURE} from "@/lib/config"

export async function POST(req:NextRequest){
  const startTime = Date.now()
  await connectDB()

  const filename = req.headers.get("x-filename")||"file"
  const folder = req.headers.get("x-folder")||"/"
  const userId = req.headers.get("x-user")

  const exists=await File.findOne({filename,folder,userId})
  if(exists){
    return NextResponse.json(
      {error:"file with same name already exists"},
      {status:400}
    )
  }

  const data=await req.arrayBuffer()
  const buffer=Buffer.from(data)
  const chunks=contentDefinedChunk(buffer)

  const chunkHashes:string[]=[]
  const chunkMeta:any[]=[]
  let order=0

  for(const chunk of chunks){
    const id=sha256(chunk)
    chunkHashes.push(id)

    const userId = req.headers.get("x-user")

    const nodes = await sendChunkReplicated(
      userId,
      id,
      chunk
    )

    chunkMeta.push({
      chunkId:id,
      nodes,
      order
    })

    order++
  }

  const rootHash=buildMerkleRoot(chunkHashes)

  const file=await File.create({
    userId,
    filename,
    folder,
    size:buffer.length,
    rootHash,
    chunks:chunkMeta,
    isHot:false
  })

  const latency = Date.now() - startTime
  const speed = buffer.length / (latency / 1000) // bytes per second

  await CacheMetrics.create({
    operation:"upload",
    architecture:ARCHITECTURE,
    cachePolicy:(process.env.CACHE_POLICY || "lru").toLowerCase(),
    coldOrHot:"cold",
    fileId:file._id.toString(),
    userId:file.userId,
    hit:false,
    cacheLevel: file.isHot ? "L1" : "STORAGE",
    latency,
    distance:0,
    nodeId:"",
    chunkCount:chunkMeta.length,
    fileSize:file.size,
    speed,
    replicaCount:3,
    verificationPassed:true
  })

  logEvent({
    type: "upload",
    fileId: file._id.toString(),
    filename: file.filename,
    userId: file.userId,
    size: buffer.length,
    latency,
    speed
  })

  logEvent({
    type: "distribute",
    fileId: file._id.toString(),
    filename: file.filename,
    userId: file.userId,
    size: buffer.length
  })

  return NextResponse.json({
    fileId:file._id,
    chunks:chunkMeta.length
  })
}