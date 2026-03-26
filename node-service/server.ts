import express from "express"
import fs from "fs"
import path from "path"
import crypto from "crypto"

const app = express()
app.use(express.raw({ type: "*/*", limit: "50mb" }))

const NODE_ID = process.env.NODE_ID || "node"
const DATA_DIR = process.env.DATA_DIR || "./data"

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

app.get("/proof/:id", (req, res) => {

  const chunkId = req.params.id
  const filePath = path.join(DATA_DIR, chunkId)

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("missing")
  }

  const data = fs.readFileSync(filePath)

  const segment = data.slice(0, 64)

  const proof = crypto
    .createHash("sha256")
    .update(segment)
    .digest("hex")

  res.json({ proof })
})

app.get("/health", (req, res) => {
  const files = fs.readdirSync(DATA_DIR)
  res.json({
    nodeId: NODE_ID,
    chunkCount: files.length,
    uptime: process.uptime()
  })
})

app.put("/chunk/:id", (req, res) => {
  const chunkId = req.params.id
  const filePath = path.join(DATA_DIR, chunkId)
  fs.writeFileSync(filePath, req.body)
  res.json({ status: "stored", chunkId })
})

app.get("/chunk/:id", (req, res) => {
  const chunkId = req.params.id
  const filePath = path.join(DATA_DIR, chunkId)
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("not found")
  }
  const data = fs.readFileSync(filePath)
  res.send(data)
})

app.delete("/chunk/:id", (req, res) => {
  const chunkId = req.params.id
  const filePath = path.join(DATA_DIR, chunkId)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  res.json({ deleted: chunkId })
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Node ${NODE_ID} running on port ${PORT}`)
})