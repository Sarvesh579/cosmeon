import mongoose from "mongoose"

const Schema=new mongoose.Schema({
  createdAt:{
    type:Date,
    default:Date.now
  },
  operation:String,
  architecture:String,
  cachePolicy:String,
  coldOrHot:String,
  fileId:String,
  userId:String,
  hit:Boolean,
  cacheLevel:String,
  latency:Number,
  endToendLatency:Number,
  distance:Number,
  nodeId:String,
  chunkCount:Number,
  fileSize:Number,
  speed:Number,
  replicaCount:Number,  
  verificationPassed:Boolean
})

export default mongoose.models.CacheMetrics||
mongoose.model("CacheMetrics",Schema)