import Node from "@/models/Node"
import File from "@/models/File"
import { connectDB } from "@/lib/db"

let isInitializing = false;

export async function initNodes(){
  if (isInitializing) return;
  isInitializing = true;

  try {
    await connectDB()

    const nodes = [
      {nodeId:"ORBIT-1",url:"http://localhost:4001",rack:"alpha",capacity:1000},
      {nodeId:"ORBIT-2",url:"http://localhost:4002",rack:"alpha",capacity:1500},
      {nodeId:"ORBIT-3",url:"http://localhost:4003",rack:"beta",capacity:800},
      {nodeId:"ORBIT-4",url:"http://localhost:4004",rack:"beta",capacity:2000},
      {nodeId:"ORBIT-5",url:"http://localhost:4005",rack:"gamma",capacity:1200}
    ]

    for(const n of nodes){
      await Node.updateOne(
        { nodeId: n.nodeId },
        { $setOnInsert: { ...n, healthy: true, used: 0 } },
        { upsert: true }
      )
    }

    // Recalculate 'used' space from existing files
    // Strategy: Build the map FIRST, then update. Never zero out everything globally first.
    const allFiles = await File.find().lean()
    const usageMap: Record<string, number> = {}
    
    // Initializing all nodes in map to 0
    const nodeDocs = await Node.find().lean()
    for(const nd of nodeDocs) usageMap[nd.nodeId] = 0

    for (const file of allFiles) {
      if (!file.chunks || file.chunks.length === 0) continue
      const chunkSize = (file.size || 0) / file.chunks.length
      
      for (const chunk of file.chunks) {
        if (!chunk.nodes) continue
        for (const nodeId of chunk.nodes) {
          usageMap[nodeId] = (usageMap[nodeId] || 0) + chunkSize
        }
      }
    }

    // Batch update the nodes with their new calculated usage
    for (const [nodeId, used] of Object.entries(usageMap)) {
      await Node.updateOne({ nodeId }, { $set: { used } })
    }

    console.log("[InitNodes] Successfully recalculated cluster occupancy.")

  } catch (err) {
    console.error("[InitNodes] Initialization failed:", err)
  } finally {
    isInitializing = false;
  }
}