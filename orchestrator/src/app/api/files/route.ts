import { NextResponse, NextRequest } from "next/server"
import { connectDB } from "@/lib/db"
import File from "@/models/File"

export async function GET(req: NextRequest) {
  await connectDB()
  const folder = req.nextUrl.searchParams.get("folder") || "/"
  const userId = req.headers.get("x-user")
  const files = await File.find({folder, userId})
  const result = files.map(f => ({
    id: f._id,
    name: f.filename,
    size: f.size,
    chunks: f.chunks.length,
    isHot: f.isHot,
    cacheExpiresAt: f.cacheExpiresAt ?? null
  }))

  return NextResponse.json(result)
}