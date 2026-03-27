import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import File from "@/models/File"
import Node from "@/models/Node"

export async function GET(req: NextRequest) {
  await connectDB()
  const filename = req.nextUrl.searchParams.get("file")

  if (!filename) {
    return NextResponse.json(
      { error: "file query param required" },
      { status: 400 }
    )
  }

  const file = await File.findOne({ filename })

  if (!file) {
    return NextResponse.json(
      { error: "file not found" },
      { status: 404 }
    )
  }

  const nodes = await Node.find()

  const chunks = file.chunks.map((c: any) => ({
    chunkId: c.chunkId,
    index: c.order ?? c.index ?? 0,
    nodes: c.nodes
  }))

  return NextResponse.json({
    file: file.filename,
    size: file.size,
    chunkCount: chunks.length,
    chunks,
    nodes: nodes.map((n: any) => ({
      nodeId: n.nodeId,
      rack: n.rack,
      healthy: n.healthy
    }))
  })
}