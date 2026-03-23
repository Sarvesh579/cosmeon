import File from "@/models/File"
import { sha256 } from "./hash"
import { fetchChunk } from "./fetchChunk"
import axios from "axios"
import { NODES } from "./nodes"

export async function selfHeal(){

  const files = await File.find()

  for(const file of files){

    for(const chunk of file.chunks){

      for(const node of chunk.nodes){

        try{

          const data = await fetchChunk(node,chunk.chunkId)

          const hash = sha256(data)

          if(hash !== chunk.chunkId){

            const source = chunk.nodes.find(n=>n!==node)

            if(!source) continue

            const correct = await fetchChunk(source,chunk.chunkId)

            await axios.put(
              `${NODES.find(n=>n.id===node)?.url}/chunk/${chunk.chunkId}`,
              correct,
              {headers:{"Content-Type":"application/octet-stream"}}
            )

          }

        }catch{}
      }
    }
  }
}