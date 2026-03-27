import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import File from "@/models/File"

export async function POST(req: NextRequest){
  await connectDB()
  const { id, name } = await req.json()
  await File.findByIdAndUpdate(id,{
    filename:name
  })
  return NextResponse.json({ok:true})
}