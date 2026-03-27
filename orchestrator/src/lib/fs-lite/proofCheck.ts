import File from "@/models/File"
import Node from "@/models/Node"
import axios from "axios"

export async function proofCheck(){
  const files = await File.find()
  for(const file of files){
    for(const chunk of file.chunks){
      for(const nodeId of chunk.nodes){
        const node = await Node.findOne({nodeId})
        try {
          const list = await axios.get(`${node.url}/chunks`)
          if (!list.data.includes(chunk.chunkId)) continue
          await axios.get(`${node.url}/proof/${chunk.chunkId}`)
        } catch {
          {/*console.log("node lost chunk", nodeId, chunk.chunkId)*/}
        }
      }
    }
  }
}