import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Node from "@/models/Node"
import User from "@/models/User"

export async function GET(req:Request){

  await connectDB()

  const {searchParams}=new URL(req.url)
  const userId=searchParams.get("userId")

  if(!userId){
    return NextResponse.json({error:"Missing userId"})
  }

  const nodes=await Node.find().lean()
  const user=await User.findById(userId).lean()

  if(!user){
    return NextResponse.json({error:"User not found"})
  }

  return NextResponse.json({
    nodes,
    userLocation:user.location,
    l1:user.cacheLayout?.L1,
    l2:user.cacheLayout?.L2 || []
  })
}