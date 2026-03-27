import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Folder from "@/models/Folder"

export async function POST(req: NextRequest) {
  await connectDB()
  const { id, name } = await req.json()
  await Folder.findByIdAndUpdate(id, { name })
  return NextResponse.json({ ok: true })
}