import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import File from "@/models/File"
import Node from "@/models/Node"

export async function GET(req: NextRequest) {
  await connectDB()

  const node = req.nextUrl.searchParams.get("node")

  const files = await File.find()

  const chunks = []

  for (const f of files) {
    for (const c of f.chunks) {
      if (c.nodes.includes(node)) {
        chunks.push({
          chunkId: c.chunkId,
          file: f.filename,
          index: c.order,
          userId: f.userId
        })
      }
    }
  }

  const nodeDoc = await Node.findOne({ nodeId: node })

  return NextResponse.json({
    healthy: nodeDoc ? nodeDoc.healthy : true,
    chunks
  })
}