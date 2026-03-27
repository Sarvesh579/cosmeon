import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import File from "@/models/File"
import axios from "axios"
import { fetchChunk } from "@/lib/fs-lite/fetchChunk"
import { NODES } from "@/lib/fs-lite/nodes"

export async function POST(req: NextRequest) {

  await connectDB()

  const { filename } = await req.json()

  const file = await File.findOne({ filename })

  if (!file) {
    return NextResponse.json({ error: "file not found" })
  }

  file.accessCount += 1

  const target = NODES.find(n => n.id === "ORBIT-5")
  if (!target) {
    return NextResponse.json(
      { error: "ORBIT-5 node not found" },
      { status: 500 }
    )
  }

  for (const chunk of file.chunks) {

    if (chunk.nodes.includes("ORBIT-5")) continue

    const source =
      chunk.nodes[Math.floor(Math.random() * chunk.nodes.length)]

    const data = await fetchChunk(source, chunk.chunkId)

    if (!data) continue

    await axios.put(
      `${target.url}/chunk/${chunk.chunkId}`,
      data,
      { headers: { "Content-Type": "application/octet-stream" } }
    )

    chunk.nodes.push("ORBIT-5")
  }

  await file.save()

  return NextResponse.json({
    ok: true,
    accessCount: file.accessCount
  })
}