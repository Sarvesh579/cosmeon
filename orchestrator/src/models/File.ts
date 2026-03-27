import mongoose from "mongoose"

const ChunkSchema = new mongoose.Schema({
  chunkId: String,
  nodes: [String],
  order: Number
})

const FileSchema = new mongoose.Schema({
  filename: String,
  size: Number,
  rootHash: String,
  chunks: [ChunkSchema],
  accessCount: {
    type: Number,
    default: 0
  },
  heatScore: {
    type: Number,
    default: 0
  },
  folder: {
    type: String,
    default: "/"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.models.File ||
mongoose.model("File", FileSchema)