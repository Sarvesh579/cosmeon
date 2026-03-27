import axios from "axios"
import Node from "@/models/Node"
import { connectDB } from "@/lib/db"

export async function fetchChunk(nodeId: string, chunkId: string) {
  await connectDB()
  const node = await Node.findOne({ nodeId })
  if (!node) return null
  try {
    const res = await axios.get(`${node.url}/chunk/${chunkId}`, {
      responseType: "arraybuffer"
    })
    return Buffer.from(res.data)
  } catch {
    return null
  }
}