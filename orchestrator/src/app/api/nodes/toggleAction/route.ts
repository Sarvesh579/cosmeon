import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Node from "@/models/Node"
import File from "@/models/File"
import { NODES } from "@/lib/fs-lite/nodes"
import axios from "axios"
import { fetchChunk } from "@/lib/fs-lite/fetchChunk"

export async function POST(req: NextRequest) {
  await connectDB()
  const { nodeId } = await req.json()
  
  const node = await Node.findOne({ nodeId })
  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 })

  const nodeConfig = NODES.find(n => n.id === nodeId)

  if (node.manualFailure !== true) {
    // 1. HARD LOCK: Save state to DB immediately using atomic update
    await Node.updateOne(
        { nodeId }, 
        { $set: { healthy: false, manualFailure: true, used: 0 } }
    )

    // 2. Identify files to migrate
    const files = await File.find({ "chunks.nodes": nodeId })
    
    // 3. TARGET POOL: Strictly healthy, non-failed, AND not the current node
    const healthyNodes = await Node.find({ healthy: true, manualFailure: false, nodeId: { $ne: nodeId } }).lean()
    const healthyNodeIds = healthyNodes.map(n => n.nodeId)
    
    const operationalTasks: Promise<any>[] = []

    for (const file of files) {
      let fileChanged = false
      for (const chunk of file.chunks) {
        if (chunk.nodes.includes(nodeId)) {
          // Remove the failed node from the chunk's list
          chunk.nodes = chunk.nodes.filter((n: string) => n !== nodeId)
          
          // Trigger physical deletion if reachable
          if (nodeConfig) {
            operationalTasks.push(
                axios.delete(`${nodeConfig.url}/chunk/${chunk.chunkId}`).catch(() => {})
            )
          }

          // Trigger Emergency Migration
          if (chunk.nodes.length > 0) {
            const sourceId = chunk.nodes[0]
            
            const migration = (async () => {
              const data = await fetchChunk(sourceId, chunk.chunkId)
              if (data) {
                // Pick a target from the healthy pool that doesn't already have this chunk
                const pool = healthyNodeIds.filter(id => id !== nodeId && !chunk.nodes.includes(id))
                if (pool.length > 0) {
                  const targetId = pool[Math.floor(Math.random() * pool.length)]
                  const targetConfig = NODES.find(n => n.id === targetId)
                  if (targetConfig) {
                    try {
                      await axios.put(`${targetConfig.url}/chunk/${chunk.chunkId}`, data, {
                        headers: { "Content-Type": "application/octet-stream" },
                        timeout: 5000
                      })
                      chunk.nodes.push(targetId)
                      await Node.updateOne({ nodeId: targetId }, { $inc: { used: data.length } })
                    } catch (e) {
                      console.error(`Migration to ${targetId} failed`, e)
                    }
                  }
                }
              }
            })()
            operationalTasks.push(migration)
          }
          fileChanged = true
        }
      }
      if (fileChanged) {
        file.markModified('chunks')
        operationalTasks.push(file.save())
      }
    }

    // 5. Await all critical data movements
    await Promise.all(operationalTasks)

  } else {
    // REACTIVATE: Restore status and remove the lock
    await Node.updateOne(
        { nodeId }, 
        { $set: { healthy: true, manualFailure: false } }
    )
  }

  return NextResponse.json({ ok: true })
}
