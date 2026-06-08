import axios from "axios"
import Node from "@/models/Node"
import {connectDB} from "@/lib/db"
import {distance} from "@/lib/distance"

function sleep(ms:number){
  return new Promise(r=>setTimeout(r,ms))
}

export async function fetchChunk(nodeId:string, chunkId:string, userLocation?:any){
  await connectDB()
  const node=await Node.findOne({nodeId})
  if(!node) return null
  
  let simulatedLatency = node.accessTime || 0

  if(userLocation && node.location){
    const km = distance(
      userLocation,
      node.location
    )
    simulatedLatency += km * 0.5
  }
  await sleep(simulatedLatency)

  try {
    const res=await axios.get(`${node.url}/chunk/${chunkId}`,{
      responseType:"arraybuffer"
    })
    return Buffer.from(res.data)
  } catch {
    return null
  }
}