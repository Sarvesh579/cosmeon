import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import File from "@/models/File"
import Node from "@/models/Node"
import { logEvent } from "@/lib/analytics"
import axios from "axios"
import { NODES } from "@/lib/fs-lite/nodes"
import CacheMetrics from "@/models/CacheMetrics"
import {ARCHITECTURE} from "@/lib/config"

export async function POST(req: NextRequest) {
  await connectDB()
  const startTime = Date.now()
  try {
    const { id } = await req.json()
    const file = await File.findById(id)
    
    if (file) {
      await logEvent({
        type: "delete",
        fileId: file._id.toString(),
        filename: file.filename,
        userId: file.userId,
        size: file.size
      })

      // Decrement capacity and delete actual chunks from nodes
      for (const chunk of file.chunks) {
        const chunkSize = file.size / file.chunks.length
        for (const nodeId of chunk.nodes) {
          // Update DB stats
          await Node.updateOne({ nodeId }, { $inc: { used: -chunkSize } })
          
          // Try to delete actual file from node
          const nodeConfig = NODES.find(n => n.id === nodeId)
          if (nodeConfig) {
            try {
              await axios.delete(`${nodeConfig.url}/chunk/${chunk.chunkId}`)
            } catch (err) {
              console.warn(`Failed to delete chunk ${chunk.chunkId} from node ${nodeId}`)
            }
          }
        }
      }

      await CacheMetrics.create({
        operation:"delete",
        architecture:ARCHITECTURE,
        cachePolicy:process.env.CACHE_POLICY || "lru",
        coldOrHot:"na",
        fileId:file._id.toString(),
        userId:file.userId,
        hit: file.isHot? true : false,
        cacheLevel: file.isHot ? "L1" : "STORAGE",
        latency:Date.now()-startTime,
        distance:0,
        nodeId:"",
        chunkCount:file.chunks.length,
        fileSize:file.size,
        speed:0,
        replicaCount:0,
        verificationPassed:true
      })

      await File.findByIdAndDelete(id)
      logEvent({
        type:"delete",
        fileId:file._id.toString(),
        filename:file.filename,
        userId:file.userId,
        latency:Date.now()-startTime,
        size:file.size
      })
      return NextResponse.json({ ok: true })
    }
    
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Operation failed" }, { status: 500 })
  }
}