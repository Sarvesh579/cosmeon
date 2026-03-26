import { NextRequest, NextResponse } from "next/server"
import File from "@/models/File"
import { connectDB } from "@/lib/db"

export async function GET(req:NextRequest){
  await connectDB()
  const node = req.nextUrl.searchParams.get("node")
  const files = await File.find()
  const chunks:string[]=[]

  for(const file of files){
    for(const chunk of file.chunks){
      if(chunk.nodes.includes(node)){
        chunks.push(chunk.chunkId)
      }
    }
  }
  return NextResponse.json(chunks)
}