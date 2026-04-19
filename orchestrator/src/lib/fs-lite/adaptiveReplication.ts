import File from "@/models/File"
import Node from "@/models/Node"
import User from "@/models/User"
import axios from "axios"
import { NODES } from "./nodes"
import { fetchChunk } from "./fetchChunk"
import { emitMapEvent } from "@/lib/mapEvents"
import { logEvent } from "@/lib/analytics"

export async function adaptiveReplication(){
  // ONLY use healthy nodes for all operations
  const healthyNodes = await Node.find({ healthy: true }).lean()
  if (healthyNodes.length === 0) return

  const nodeMap = Object.fromEntries(healthyNodes.map(n => [n.nodeId, n]))
  const healthyNodeIds = healthyNodes.map(n => n.nodeId)

  const files = await File.find()

  for(const file of files){
    try {
      const user = await User.findById(file.userId).lean()
      if (!user) continue

      const currentHeat = file.accessCount
      
      let targetReplicas = 2
      if(currentHeat > 10) targetReplicas = 3
      else if(currentHeat > 3) targetReplicas = 3 

      const l1Node = user.cacheLayout?.L1
      const l2Nodes = user.cacheLayout?.L2 || []

      let replicated = false
      let cooled = false

      for(const chunk of file.chunks){
        // Ensure we only count healthy nodes in current residencies
        const currentResidences = chunk.nodes.filter((nid: string) => healthyNodeIds.includes(nid))
        
        // Update residency list if some nodes died
        if (currentResidences.length !== chunk.nodes.length) {
          chunk.nodes = currentResidences
        }

        // Migration/Replication logic
        if(chunk.nodes.length < targetReplicas && chunk.nodes.length > 0) {
          const sourceId = chunk.nodes[0]
          const sourceNode = nodeMap[sourceId]
          const data = await fetchChunk(sourceId, chunk.chunkId)
          
          if (data && sourceNode) {
            let targetId = ""
            // Target L1 if hot
            if (targetReplicas === 3 && l1Node && healthyNodeIds.includes(l1Node) && !chunk.nodes.includes(l1Node)) {
              targetId = l1Node
            } else if (targetReplicas >= 2) {
              const availableL2 = l2Nodes.filter((id:string) => healthyNodeIds.includes(id) && !chunk.nodes.includes(id))
              if (availableL2.length > 0) targetId = availableL2[0]
            }

            if (!targetId) {
              const pool = healthyNodeIds.filter(id => !chunk.nodes.includes(id))
              if (pool.length > 0) targetId = pool[Math.floor(Math.random()*pool.length)]
            }

            if (targetId) {
              const targetConfig = NODES.find(n => n.id === targetId)
              const targetNode = nodeMap[targetId]
              
              if (targetConfig) {
                try {
                  await axios.put(`${targetConfig.url}/chunk/${chunk.chunkId}`, data, {
                    headers: {"Content-Type": "application/octet-stream"}
                  })
                  await Node.updateOne({ nodeId: targetId }, { $inc: { used: data.length } })
                  chunk.nodes.push(targetId)
                  
                  if (!replicated && targetNode?.location && sourceNode.location) {
                    emitMapEvent({
                      type: "replicate",
                      from: sourceNode.location,
                      to: [targetNode.location],
                      name: file.filename
                    })
                    replicated = true
                  }
                } catch (err) {
                  console.error(`Failed to replicate to ${targetId}`, err)
                }
              }
            }
          }
        } 
        // Cooling logic
        else if (chunk.nodes.length > targetReplicas) {
          const victimId = chunk.nodes.pop()
          const victimNode = nodeMap[victimId] || { location: null }
          const chunkSize = file.size / file.chunks.length
          
          // Only update capacity if node was healthy (capacity tracking)
          await Node.updateOne({ nodeId: victimId }, { $inc: { used: -chunkSize } })
          
          if (!cooled && victimNode?.location) {
            emitMapEvent({
              type: "evict",
              from: victimNode.location,
              to: [],
              name: file.filename
            })
            cooled = true
          }
          
          const nodeConfig = NODES.find(n => n.id === victimId)
          if (nodeConfig) {
            axios.delete(`${nodeConfig.url}/chunk/${chunk.chunkId}`).catch(() => {})
          }
        }
      }

      if (replicated || cooled) {
        // Log events once per file movement
        if (replicated) logEvent({ type: "distribute", fileId: file._id.toString(), filename: file.filename, userId: file.userId, size: file.size })
        if (cooled) logEvent({ type: "cool", fileId: file._id.toString(), filename: file.filename, userId: file.userId, size: file.size })
        
        file.markModified('chunks')
      }

      file.heatScore = currentHeat
      file.accessCount = 0
      
      try {
        await file.save()
      } catch (saveErr: any) {
        if (saveErr.name !== 'VersionError') throw saveErr
      }

    } catch (err) {
      console.error(`[AdaptiveReplication] Error processing file ${file.filename}:`, err)
    }
  }
}