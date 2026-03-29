import {NextRequest,NextResponse} from "next/server"
import {connectDB} from "@/lib/db"
import Folder from "@/models/Folder"

export async function GET(req:NextRequest){
  await connectDB()
  const userId=req.headers.get("x-user")
  const folders=await Folder.find({userId})
  return NextResponse.json(folders)
}

export async function POST(req:NextRequest){
  await connectDB()
  const userId=req.headers.get("x-user")
  const {name,parent}=await req.json()
  await Folder.create({name,parent,userId})
  return NextResponse.json({ok:true})
}