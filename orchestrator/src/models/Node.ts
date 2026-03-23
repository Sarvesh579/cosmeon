import mongoose from "mongoose"

const NodeSchema = new mongoose.Schema({
  nodeId: String,
  url: String,
  rack: String,
  capacity: Number,
  used: Number,
  latency: Number,
  healthy: Boolean,
  lastSeen: Date
})

export default mongoose.models.Node ||
mongoose.model("Node", NodeSchema)