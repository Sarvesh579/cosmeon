import { NextRequest, NextResponse } from "next/server"
import File from "@/models/File"
import { connectDB } from "@/lib/db"

export async function GET(req: NextRequest) {
  await connectDB()
  const node = req.nextUrl.searchParams.get("node")
  if (!node) {
    return NextResponse.json({ error: "node missing" }, { status: 400 })
  }
  const files = await File.find().lean()
  const chunks: any[] = []

  for (const file of files) {
    file.chunks.forEach((chunk: any, index: number) => {
      if (chunk.nodes.includes(node)) {
        chunks.push({
          chunkId: chunk.chunkId,
          file: file.filename,
          index
        })
      }
    })
  }
  return NextResponse.json(chunks)
}