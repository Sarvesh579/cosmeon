import axios from "axios"
import Node from "@/models/Node"
import User from "@/models/User"

export async function sendChunkReplicated(
  userId:string,
  chunkId:string,
  chunk:Buffer
){
  const user=await User.findById(userId)
  if(!user) throw new Error("user not found")

  const targets=[
    user.cacheLayout.L1,
    ...user.cacheLayout.L2
  ]

  console.log("targets",targets)

  const nodes=await Node.find({
    nodeId:{$in:targets},
    healthy:true
  })

  const selected:string[]=[]

  for(const node of nodes){
    await axios.put(`${node.url}/chunk/${chunkId}`,chunk,{
      headers:{"Content-Type":"application/octet-stream"}
    })
    selected.push(node.nodeId)
  }

  return selected
}