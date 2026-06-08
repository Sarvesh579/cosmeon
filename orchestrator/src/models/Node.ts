import mongoose from "mongoose"

const NodeSchema = new mongoose.Schema({
  nodeId: String,
  url: String,
  rack: String,
  storageType: {
    type: String,
    enum: ["storage", "cache"],
    required: true
  },
  accessTime: {
    type: Number,
    default: 0
  },
  capacity: Number,
  used: Number,
  latency: Number,
  healthy: Boolean,
  manualFailure: { type: Boolean, default: false },
  lastSeen: Date,
  location: {
    lat:{ type:Number },
    lon:{ type:Number }
  }
})

export default mongoose.models.Node ||
mongoose.model("Node", NodeSchema)