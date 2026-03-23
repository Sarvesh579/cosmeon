import Node from "@/models/Node"
import axios from "axios"

export async function monitorNodes(){
  const nodes = await Node.find()

  for(const node of nodes){
    try{
      const res = await axios.get(`${node.url}/health`)

      node.healthy = true
      node.used = res.data.chunkCount
      node.lastSeen = new Date()
      await node.save()

    }catch{
      node.healthy = false
      await node.save()
    }
  }
}