import axios from "axios"
import Node from "@/models/Node"
import User from "@/models/User"

export async function sendChunkReplicated(
  userId:string,
  chunkId:string,
  chunk:Buffer
){
  const user = await User.findById(userId).lean()
  const l1 = user?.cacheLayout?.L1
  const l2 = user?.cacheLayout?.L2 || []

  // Skip cache nodes for initial upload
  const allNodes = await Node.find({healthy:true})
  const storageNodes = allNodes.filter(n => n.nodeId !== l1 && !l2.includes(n.nodeId))

  const replicas=3
  // Ensure we only use storage nodes for initial placement
  if (storageNodes.length < replicas) {
    console.warn(`Insufficient standard storage nodes (${storageNodes.length}). Using all available non-cache nodes.`)
  }
  
  const pool = storageNodes.length > 0 ? storageNodes : allNodes
  const shuffled=[...pool].sort(()=>Math.random()-0.5)
  const targets=shuffled.slice(0, Math.min(replicas, pool.length))
  const selected:string[]=[]

  for(const node of targets){
    await axios.put(`${node.url}/chunk/${chunkId}`,chunk,{
      headers:{"Content-Type":"application/octet-stream"}
    })
    selected.push(node.nodeId)
  }

  return selected
}