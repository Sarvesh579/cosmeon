import Node from "@/models/Node"
import File from "@/models/File"
import { fetchChunk } from "./fetchChunk"
import axios from "axios"
import { NODES } from "./nodes"

export async function handleNodeFailures(){
  const failed = await Node.find({healthy:false})

  for(const node of failed){
    const files = await File.find()

    for(const file of files){
      for(const chunk of file.chunks){
        if(!chunk.nodes.includes(node.nodeId)) continue

        const source = chunk.nodes.find(n=>n!==node.nodeId)

        if(!source) continue

        const data = await fetchChunk(source,chunk.chunkId)
        const target = NODES[Math.floor(Math.random()*NODES.length)]

        await axios.put(
          `${target.url}/chunk/${chunk.chunkId}`,
          data,
          {headers:{"Content-Type":"application/octet-stream"}}
        )
        chunk.nodes = chunk.nodes.filter(n=>n!==node.nodeId)
        chunk.nodes.push(target.id)
      }
    }
  }
}