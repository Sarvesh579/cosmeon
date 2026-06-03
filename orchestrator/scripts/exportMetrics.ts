import mongoose from "mongoose"
import fs from "fs"
import CacheMetrics from "../src/models/CacheMetrics"

async function run(){
  const columns=[
    "operation",
    "architecture",
    "cachePolicy",
    "coldOrHot",
    "fileId",
    "userId",
    "hit",
    "cacheLevel",
    "latency",
    "distance",
    "nodeId",
    "chunkCount",
    "fileSize",
    "speed",
    "replicaCount",
    "verificationPassed",
    "createdAt"
  ]

  await mongoose.connect(
    "mongodb://localhost:27017/cosmeon"
  )

  const logs = await CacheMetrics.find().lean()
  if(!logs.length){
    console.log("No logged metrics found")
    return
  }

  const header=columns.join(",")

  const rows=logs.map(log =>
    columns.map(c => 
      `"${String(log[c] ?? "")}"`
    ).join(",")
  )

  try {
    fs.writeFileSync(
      "experiment-results.csv",
      [header,...rows].join("\n")
    )

    console.log(
      "exported",
      logs.length,
      "rows"
    )
  } catch(e) {
    console.error("Failed to write CSV file:", e)
  }

  await mongoose.disconnect()
}

run()