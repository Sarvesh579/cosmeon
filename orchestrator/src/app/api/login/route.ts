import {NextRequest,NextResponse} from "next/server"
import {connectDB} from "@/lib/db"
import User from "@/models/User"
import Node from "@/models/Node"
import {computeCache} from "@/lib/cacheLayout"

export async function POST(req:NextRequest){
  await connectDB()
  const {username,password}=await req.json()

  const user=await User.findOne({username,password})
  if(!user){
    return NextResponse.json({error:"invalid"})
  }

  const nodes=await Node.find({healthy:true})
  const layout=computeCache(user,nodes)

  user.cacheLayout=layout
  await user.save()

  return NextResponse.json({
    userId:user._id,
    username:user.username,
    location:user.location,
    cacheLayout:user.cacheLayout
  })
}