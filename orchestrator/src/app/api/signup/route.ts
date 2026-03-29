import {NextRequest,NextResponse} from "next/server"
import {connectDB} from "@/lib/db"
import User from "@/models/User"
import Node from "@/models/Node"
import {computeCache} from "@/lib/cacheLayout"

export async function POST(req:NextRequest){
  await connectDB()

  const {username,password,location}=await req.json()

  const exists=await User.findOne({username})
  if(exists){
    return NextResponse.json({error:"user exists"})
  }

  const nodes=await Node.find({healthy:true})

  const user=new User({
    username,
    password,
    location
  })

  user.cacheLayout=computeCache(user,nodes)

  await user.save()

  return NextResponse.json({
    userId:user._id,
    username:user.username,
    cacheLayout:user.cacheLayout
  })
}