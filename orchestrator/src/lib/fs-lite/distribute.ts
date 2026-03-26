import axios from "axios"
import Node from "@/models/Node"

export async function sendChunkReplicated(
  chunkId: string,
  chunk: Buffer,
  replicas = 2
) {

  const nodes = await Node.find({ healthy: true })
  const racks: any = {}
  const selected: string[] = []

  for (const n of nodes) {
    if (!racks[n.rack]) racks[n.rack] = []
    racks[n.rack].push(n)
  }

  const rackList = Object.keys(racks)

  for (let i = 0; i < replicas; i++) {
    const rack = rackList[i % rackList.length]
    const node = racks[rack][0]
    await axios.put(`${node.url}/chunk/${chunkId}`, chunk, {
      headers: { "Content-Type": "application/octet-stream" }
    })
    selected.push(node.nodeId)
  }

  return selected
}