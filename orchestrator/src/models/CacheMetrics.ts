import mongoose from "mongoose"

const Schema=new mongoose.Schema({
  policy:String,
  fileId:String,
  userId:String,
  hit:Boolean,
  cacheLevel:String,
  latency:Number,
  distance:Number,
  nodeId:String,
  chunkCount:Number,
  fileSize:Number,
  speed:Number,
  replicaCount:Number,
  architecture:String,
  cachePolicy:String,
  coldOrHot:String,
  verificationPassed:Boolean,
  createdAt:{
    type:Date,
    default:Date.now
  }
})

export default mongoose.models.CacheMetrics||
mongoose.model("CacheMetrics",Schema)