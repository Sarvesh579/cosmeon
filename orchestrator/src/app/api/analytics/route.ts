import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Analytics from "@/models/Analytics"
import Node from "@/models/Node"

export async function GET(req: NextRequest) {
  await connectDB()
  
  const events = await Analytics.find()
    .sort({ timestamp: -1 })
    .limit(10000)
    .lean()

  const nodes = await Node.find().lean()

  return NextResponse.json({ events, nodes })
}

export async function DELETE(req: NextRequest) {
  await connectDB()
  await Analytics.deleteMany({})
  return NextResponse.json({ ok: true })
}
