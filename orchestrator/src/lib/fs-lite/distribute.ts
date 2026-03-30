import axios from "axios"
import Node from "@/models/Node"

export async function sendChunkReplicated(
  userId:string,
  chunkId:string,
  chunk:Buffer
){
  const nodes=await Node.find({healthy:true})
  const replicas=3
  const shuffled=[...nodes].sort(()=>Math.random()-0.5)
  const targets=shuffled.slice(0,replicas)
  const selected:string[]=[]

  for(const node of targets){
    await axios.put(`${node.url}/chunk/${chunkId}`,chunk,{
      headers:{"Content-Type":"application/octet-stream"}
    })
    selected.push(node.nodeId)
  }

  return selected
}