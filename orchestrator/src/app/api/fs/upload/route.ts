import { NextRequest, NextResponse } from "next/server"
import { contentDefinedChunk } from "@/lib/fs-lite/chunker"
import { sha256 } from "@/lib/fs-lite/hash"
import { sendChunkReplicated } from "@/lib/fs-lite/distribute"
import { buildMerkleRoot } from "@/lib/fs-lite/merkle"
import { connectDB } from "@/lib/db"
import File from "@/models/File"

export async function POST(req: NextRequest) {

  await connectDB()

  const filename = req.headers.get("x-filename") || "file"

  const data = await req.arrayBuffer()
  const buffer = Buffer.from(data)

  const chunks = contentDefinedChunk(buffer)

  const chunkHashes: string[] = []
  const chunkMeta: any[] = []

  let order = 0

  for (const chunk of chunks) {

    const id = sha256(chunk)
    const nodes = await sendChunkReplicated(id,chunk,2)

    chunkMeta.push({
      chunkId:id,
      nodes,
      order
    })
    order++
  }

  const rootHash = buildMerkleRoot(chunkHashes)

  const file = await File.create({
    filename,
    size: buffer.length,
    rootHash,
    chunks: chunkMeta
  })

  return NextResponse.json({
    fileId: file._id,
    chunks: chunkMeta.length
  })
}