import axios from "axios"
import { NODES } from "./nodes"

export async function fetchChunk(nodeId: string, chunkId: string) {

  const node = NODES.find(n => n.id === nodeId)

  if (!node) throw new Error("node not found")

  const res = await axios.get(`${node.url}/chunk/${chunkId}`, {
    responseType: "arraybuffer"
  })

  return Buffer.from(res.data)
}