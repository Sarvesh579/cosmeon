import mongoose from "mongoose"

const FolderSchema = new mongoose.Schema({
  name: String,
  parent: {
    type: String,
    default: "/"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.models.Folder ||
mongoose.model("Folder", FolderSchema)