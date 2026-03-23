import { connectDB } from "@/lib/db"
import Node from "@/models/Node"
import File from "@/models/File"
import { computeFaultScore } from "@/lib/fs-lite/faultScore"
import { NextResponse } from "next/server"

export async function GET(){
  await connectDB()

  const nodes = await Node.find()
  const files = await File.countDocuments()
  const faultScore = await computeFaultScore()

  return NextResponse.json({
    nodes,
    files,
    faultScore
  })
}