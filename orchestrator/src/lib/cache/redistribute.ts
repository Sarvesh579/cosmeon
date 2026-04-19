import File from "@/models/File"
import Node from "@/models/Node"
import User from "@/models/User"
import axios from "axios"
import { emitMapEvent } from "@/lib/mapEvents"
import { logEvent } from "@/lib/analytics"


/**
 * Runs periodically. Finds files whose cacheExpiresAt has passed (stale hot files),
 * removes their chunks from cache nodes, and emits a cooldown animation from
 * cache → one storage node so the map shows the data "falling back to cold storage".
 */
export async function redistributeColdFiles() {
  const now = new Date()

  // Find files that are hot but whose TTL has expired
  const expiredFiles = await File.find({
    isHot: true,
    cacheExpiresAt: { $lt: now }
  })

  if (expiredFiles.length === 0) return

  const allNodes = await Node.find().lean()
  const nodeMap = Object.fromEntries(allNodes.map(n => [n.nodeId, n]))

  for (const file of expiredFiles) {
    const user = await User.findById(file.userId).lean()
    if (!user) continue

    const cacheNodeIds: string[] = [
      ...(user.cacheLayout?.L1 ? [user.cacheLayout.L1] : []),
      ...(user.cacheLayout?.L2 || [])
    ]

    // Find a non-cache storage node to target in the animation
    const storageNode = allNodes.find(n =>
      !cacheNodeIds.includes(n.nodeId) && n.location?.lat && n.location?.lon
    )

    let emittedCooldown = false

    // Evict chunks from all cache nodes for this file
    for (const chunk of file.chunks) {
      for (const cacheNodeId of cacheNodeIds) {
        if (!chunk.nodes.includes(cacheNodeId)) continue

        const cacheNode = nodeMap[cacheNodeId]
        if (!cacheNode) continue

        // Fire one cooldown animation per file (cache → storage node)
        // so the map shows the packet travelling back to cold storage
        if (!emittedCooldown && storageNode?.location && cacheNode.location) {
          emitMapEvent({
            type: "cooldown",
            from: cacheNode.location,
            to: [storageNode.location],
            name: file.filename
          })
          emittedCooldown = true
        }

        try {
          await axios.delete(`${cacheNode.url}/chunk/${chunk.chunkId}`)
          await Node.updateOne({ nodeId: cacheNodeId }, { $inc: { used: -file.size / file.chunks.length } }) // Approximation since chunks might vary slightly but usually fixed size
        } catch (err) {
          // Node may already be missing the chunk — non-critical
          console.warn(`Could not evict chunk ${chunk.chunkId} from ${cacheNodeId}:`, err)
        }

        // Remove cache node from chunk's node list
        chunk.nodes = chunk.nodes.filter((n: string) => n !== cacheNodeId)
      }
    }

    file.isHot = false
    file.cacheExpiresAt = undefined
    await file.save()

    logEvent({
      type: "cool",
      fileId: file._id.toString(),
      filename: file.filename,
      userId: file.userId,
      size: file.size
    })

    console.log(`[Redistribute] Cooled file: ${file.filename} (${file._id})`)
  }
}