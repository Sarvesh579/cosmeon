import mongoose from "mongoose"

const Schema=new mongoose.Schema({
  policy:String,
  fileId:String,
  userId:String,
  hit:Boolean,
  latency:Number,
  distance:Number,
  nodeId:String,
  createdAt:{type:Date,default:Date.now}
})

export default mongoose.models.CacheMetrics||
mongoose.model("CacheMetrics",Schema)