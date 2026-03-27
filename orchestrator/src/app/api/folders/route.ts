import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Folder from "@/models/Folder"

export async function GET(){
  await connectDB()
  const folders = await Folder.find()
  return NextResponse.json(folders)
}

export async function POST(req:NextRequest){
  await connectDB()
  const {name,parent} = await req.json()
  await Folder.create({name,parent})
  return NextResponse.json({ok:true})
}

