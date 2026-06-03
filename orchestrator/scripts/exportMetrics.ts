import mongoose from "mongoose"
import fs from "fs"
import CacheMetrics from "../src/models/CacheMetrics"

async function run(){
  await mongoose.connect(
    "mongodb://localhost:27017/cosmeon"
  )

  const logs = await CacheMetrics.find().lean()
  if(!logs.length){
    console.log("No logged metrics found")
    return
  }
  const header=
    Object.keys(logs[0]).join(",")

  const rows=logs.map(
    r=>Object.values(r).join(",")
  )

  fs.writeFileSync(
    "experiment-results.csv",
    [header,...rows].join("\n")
  )

  console.log(
    "exported",
    logs.length,
    "rows"
  )
}

run()