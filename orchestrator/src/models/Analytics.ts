import mongoose from "mongoose"

const AnalyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["upload", "download", "distribute", "cool", "heat", "delete"],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  fileId: String,
  filename: String,
  userId: String,
  size: Number, // In bytes
  latency: Number, // In ms
  speed: Number, // In bytes/s
  nodeStats: [
    {
      nodeId: String,
      used: Number,
      capacity: Number
    }
  ]
})

export default mongoose.models.Analytics ||
  mongoose.model("Analytics", AnalyticsSchema)
