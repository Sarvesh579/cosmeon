import { connectDB } from "@/lib/db"
import File from "@/models/File"
import { NextResponse } from "next/server"

export async function GET(){
  await connectDB()
  const files = await File.find()
  return NextResponse.json(files)
}