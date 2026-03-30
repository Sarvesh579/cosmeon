import {NextRequest,NextResponse} from "next/server"
import {contentDefinedChunk} from "@/lib/fs-lite/chunker"
import {sha256} from "@/lib/fs-lite/hash"
import {sendChunkReplicated} from "@/lib/fs-lite/distribute"
import {buildMerkleRoot} from "@/lib/fs-lite/merkle"
import {connectDB} from "@/lib/db"
import File from "@/models/File"
import { CACHE_TTL } from "@/lib/cache/cacheManager"

export async function POST(req:NextRequest){
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
    cacheExpiresAt:new Date(Date.now()+CACHE_TTL),
    isHot:true
  })

  return NextResponse.json({
    fileId:file._id,
    chunks:chunkMeta.length
  })
}