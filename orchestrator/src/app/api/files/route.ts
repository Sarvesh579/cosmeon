import { NextResponse, NextRequest } from "next/server"
import { connectDB } from "@/lib/db"
import File from "@/models/File"

export async function GET(req: NextRequest) {
  await connectDB()
  const folder = req.nextUrl.searchParams.get("folder") || "/"
  const userId = req.headers.get("x-user")
  const files = await File.find({folder, userId})
  const result = files.map(f => {
    // Collect all unique node IDs across all chunks
    const nodeSet = new Set<string>()
    f.chunks.forEach((c: any) => {
      c.nodes.forEach((n: string) => nodeSet.add(n))
    })
    
    return {
      id: f._id,
      name: f.filename,
      size: f.size,
      chunks: f.chunks.length,
      isHot: f.isHot,
      cacheExpiresAt: f.cacheExpiresAt ?? null,
      storageNodes: Array.from(nodeSet) // Added this to help with accurate animations
    }
  })

  return NextResponse.json(result)
}