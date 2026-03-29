import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
  username:String,
  password:String,
  location:{
    lat:Number,
    lon:Number
  },
  cacheLayout:{
    L1:String,
    L2:[String]
  }
})

export default mongoose.models.User ||
mongoose.model("User", UserSchema)