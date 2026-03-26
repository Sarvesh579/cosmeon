import File from "@/models/File"
import axios from "axios"
import { NODES } from "./nodes"
import { fetchChunk } from "./fetchChunk"

export async function adaptiveReplication(){
  const files = await File.find()

  for(const file of files){
    file.heatScore = file.accessCount
    file.accessCount = 0

    await file.save()

    let targetReplicas = 1

    if(file.heatScore > 10) targetReplicas = 3
    else if(file.heatScore > 3) targetReplicas = 2

    for(const chunk of file.chunks){
      if(chunk.nodes.length >= targetReplicas) continue
      const source = chunk.nodes[0]
      const data = await fetchChunk(source, chunk.chunkId)
      if (!data) continue
      const node = NODES[Math.floor(Math.random()*NODES.length)]

      await axios.put(`${node.url}/chunk/${chunk.chunkId}`,data,{
        headers:{"Content-Type":"application/octet-stream"}
      })
      chunk.nodes.push(node.id)
    }
    await file.save()
  }
}