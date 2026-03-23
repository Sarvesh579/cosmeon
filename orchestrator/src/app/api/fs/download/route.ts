import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import File from "@/models/File"
import { fetchChunk } from "@/lib/fs-lite/fetchChunk"

export async function GET(req: NextRequest) {

  await connectDB()

  const id = req.nextUrl.searchParams.get("id")

  const file = await File.findById(id)

  if (!file) {
    return NextResponse.json({ error: "file not found" })
  }

  file.accessCount += 1
  await file.save()

  const sorted = file.chunks.sort((a:any,b:any)=>a.order-b.order)

  const buffers: Buffer[] = []

  for(const chunk of sorted){

    let data

    for(const node of chunk.nodes){

      try{

        data = await fetchChunk(node,chunk.chunkId)
        break

      }catch{}

    }

    if(!data){
      throw new Error("chunk unavailable")
    }

    buffers.push(data)
  }

  const fileBuffer = Buffer.concat(buffers)

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.filename}"`
    }
  })
}