import File from "@/models/File"
import Node from "@/models/Node"
import User from "@/models/User"
import axios from "axios"
import { NODES } from "./nodes"
import { fetchChunk } from "./fetchChunk"
import { emitMapEvent } from "@/lib/mapEvents"

export async function adaptiveReplication(){
  const files = await File.find()
  const allNodes = await Node.find().lean()
  const nodeMap = Object.fromEntries(allNodes.map(n => [n.nodeId, n]))

  for(const file of files){
    const user = await User.findById(file.userId).lean()
    if (!user) continue

    file.heatScore = file.accessCount
    file.accessCount = 0
    await file.save()

    let targetReplicas = 1
    if(file.heatScore > 10) targetReplicas = 3
    else if(file.heatScore > 3) targetReplicas = 2

    // Target cache layout for this user
    const l1Node = user.cacheLayout?.L1
    const l2Nodes = user.cacheLayout?.L2 || []

    for(const chunk of file.chunks){
      const currentNodes = [...chunk.nodes]
      
      // Migration/Replication logic
      if(currentNodes.length < targetReplicas) {
        const sourceId = currentNodes[0]
        const sourceNode = nodeMap[sourceId]
        const data = await fetchChunk(sourceId, chunk.chunkId)
        
        if (data && sourceNode) {
          // Prioritize cache nodes if hot
          let targetId = ""
          if (targetReplicas === 3 && l1Node && !currentNodes.includes(l1Node)) {
            targetId = l1Node
          } else if (targetReplicas >= 2) {
            const availableL2 = l2Nodes.filter((id:string) => !currentNodes.includes(id))
            if (availableL2.length > 0) targetId = availableL2[0]
          }

          // If no specific cache target needed or available, pick random
          if (!targetId) {
            const availableNodes = NODES.filter(n => !currentNodes.includes(n.id))
            if (availableNodes.length > 0) targetId = availableNodes[Math.floor(Math.random()*availableNodes.length)].id
          }

          if (targetId) {
            const targetConfig = NODES.find(n => n.id === targetId)
            const targetNode = nodeMap[targetId]
            
            if (targetConfig) {
              try {
                await axios.put(`${targetConfig.url}/chunk/${chunk.chunkId}`, data, {
                  headers: {"Content-Type": "application/octet-stream"}
                })
                chunk.nodes.push(targetId)
                
                if (targetNode?.location && sourceNode.location) {
                  emitMapEvent({
                    type: "replicate",
                    from: sourceNode.location,
                    to: [targetNode.location],
                    name: file.filename
                  })
                }
              } catch (err) {
                console.error(`Failed to replicate to ${targetId}`, err)
              }
            }
          }
        }
      } 
      // Cooling logic: remove replicas if too many, prioritize keeping L1/L2 if still relatively hot
      else if (currentNodes.length > targetReplicas) {
        // Find a node to remove that isn't the primary source and ideally isn't a cache node if still warm
        const victimId = chunk.nodes.pop()
        const victimNode = nodeMap[victimId]
        
        if (victimNode?.location) {
          emitMapEvent({
            type: "evict",
            from: victimNode.location,
            to: [],
            name: file.filename
          })
        }
        
        const nodeConfig = NODES.find(n => n.id === victimId)
        if (nodeConfig) {
          axios.delete(`${nodeConfig.url}/chunk/${chunk.chunkId}`).catch(() => {})
        }
      }
    }
    await file.save()
  }
}