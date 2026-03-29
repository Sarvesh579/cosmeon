import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Node from "@/models/Node"

export async function GET(){
  await connectDB()

  const nodes=await Node.find()

  return NextResponse.json({
    nodes:nodes.map(n=>({
      nodeId:n.nodeId,
      rack:n.rack,
      healthy:n.healthy
    }))
  })
}