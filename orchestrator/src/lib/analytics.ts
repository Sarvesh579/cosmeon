import Analytics from "@/models/Analytics"
import Node from "@/models/Node"
import { connectDB } from "@/lib/db"

interface AnalyticsData {
  type: "upload" | "download" | "distribute" | "cool" | "heat" | "delete"
  fileId?: string
  filename?: string
  userId?: string
  size?: number
  latency?: number
  speed?: number
}

export async function logEvent(data: AnalyticsData) {
  try {
    await connectDB()
    const nodes = await Node.find({}).lean()
    const nodeStats = nodes.map(n => ({
      nodeId: n.nodeId,
      used: Math.max(0, n.used || 0),
      capacity: (n.capacity || 0) * 1024 * 1024
    }))

    // Save the new event
    await Analytics.create({
      ...data,
      nodeStats,
      timestamp: new Date()
    })

    // Keep only the latest 10000 entries
    const count = await Analytics.countDocuments()
    if (count > 10000) {
      const oldestToKeep = await Analytics.find()
        .sort({ timestamp: -1 })
        .skip(9999)
        .limit(1)
        .select("_id")
        .lean()
      
      if (oldestToKeep.length > 0) {
        await Analytics.deleteMany({
          timestamp: { $lt: oldestToKeep[0].timestamp }
        })
      }
    }
  } catch (err) {
    console.error("Failed to log analytics event:", err)
  }
}
