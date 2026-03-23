import axios from "axios"
import { NODES } from "./nodes"

export async function sendChunkReplicated(chunkId:string,chunk:Buffer,replicas=2){
  const nodes = []

  for(let i=0;i<replicas;i++){
    const node = NODES[(Math.floor(Math.random()*NODES.length))]
    await axios.put(`${node.url}/chunk/${chunkId}`,chunk,{
      headers:{"Content-Type":"application/octet-stream"}
    })
    nodes.push(node.id)
  }
  return nodes
}