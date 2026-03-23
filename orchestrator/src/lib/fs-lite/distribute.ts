import axios from "axios"
import { NODES } from "./nodes"

let index = 0

export async function sendChunk(chunkId: string, chunk: Buffer) {

  const node = NODES[index % NODES.length]
  index++

  await axios.put(`${node.url}/chunk/${chunkId}`, chunk, {
    headers: { "Content-Type": "application/octet-stream" }
  })

  return node.id
}