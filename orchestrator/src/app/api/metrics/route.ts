import {NextResponse} from "next/server"
import {connectDB} from "@/lib/db"
import CacheMetrics from "@/models/CacheMetrics"

export async function GET(){
  await connectDB()
  const metrics=await CacheMetrics.find()
  return NextResponse.json(metrics)
}