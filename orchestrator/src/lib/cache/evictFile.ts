import File from "@/models/File"
import Node from "@/models/Node"
import axios from "axios"

export async function evictFile(
  fileId:string
){
  const file=await File.findById(fileId)
  if(!file) return

  for(const chunk of file.chunks){
    const cacheNodes=
      chunk.nodes.filter(
        (n:string)=>
          n.startsWith("ORBIT-1") ||
          n.startsWith("ORBIT-2") ||
          n.startsWith("ORBIT-3")
      )

    for(const nodeId of cacheNodes){
      const node=
        await Node.findOne({nodeId})
      if(!node) continue
      
      try{
        await axios.delete(
          `${node.url}/chunk/${chunk.chunkId}`
        )
      }catch{}
    }
  }

  file.isHot=false
  file.heatScore=0
  await file.save()
}