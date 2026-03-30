import File from "@/models/File"
import Node from "@/models/Node"
import {sendChunkReplicated} from "@/lib/fs-lite/distribute"

export async function redistributeColdFiles(){
  const files=await File.find({
    cacheExpiresAt:{$lt:new Date()},
    isHot:true
  })

  const nodes=await Node.find({healthy:true})

  for(const file of files){
    const shuffled=[...nodes].sort(()=>Math.random()-0.5)
    const targets=shuffled.slice(0,3)

    for(const chunk of file.chunks){
      await sendChunkReplicated(
        file.userId,
        chunk.chunkId,
        chunk.data
      )
    }

    file.isHot=false
    await file.save()
  }
}