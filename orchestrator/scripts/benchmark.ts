import crypto from "crypto"
import cliProgress from "cli-progress"

const FILES = 20 // Number of files to upload/download/delete in the benchmark

function RandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min)
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

async function run() {
  const uploaded: any[] = []

  const multibar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format:
        "{task} |{bar}| {percentage}% || {value}/{total}"
    },
    cliProgress.Presets.shades_classic
  )

  // ---------------- UPLOAD ----------------
  const uploadBar = multibar.create(FILES, 0, {
    task: "UPLOAD       "
  })

  for (let i = 0; i < FILES; i++) {
    const data = crypto.randomBytes(
      1024 * RandomInt(100, 1024)
    )

    const res = await fetch(
      "http://localhost:3000/api/fs/upload",
      {
        method: "POST",
        headers: {
          "x-filename": `bench-${i}.bin`,
          "x-user": "69cfffee616f420dbf6f354c"
        },
        body: data
      }
    )

    if (!res.ok) {
      const body = await res.text()
      throw new Error(
        `Upload failed (${res.status})\n ${body}`
      )
    }

    const result = await res.json()
    uploaded.push(result)
    uploadBar.increment()
  }
  uploadBar.stop()

  // ---------------- RANDOM DOWNLOADS ----------------
  const downloadQueue = shuffle([
    ...uploaded,
    ...uploaded
  ]) // each file appears exactly twice

  const downloadBar = multibar.create(
    downloadQueue.length,
    0, {
      task: "DOWNLOADS    "
    }
  )

  for (const f of downloadQueue) {
    const down = await fetch(
      `http://localhost:3000/api/fs/download?id=${f.fileId}`
    )
    if (!down.ok) {
      const body = await down.text()

      throw new Error(
        `Download failed (${down.status})\n${body}`
      )
    }
    await down.arrayBuffer()
    downloadBar.increment()
  }
  downloadBar.stop()

  // ---------------- WAITING -----------------
  const waitBar = multibar.create(10, 0, {
    task: "WAITING      "
  })

  for (let i = 0; i < 10; i++) {
    await new Promise(r =>
      setTimeout(r, 1000)
    )

    waitBar.increment()
  }

  waitBar.stop()
  
  // ---------------- DELETE ----------------
  const deleteBar = multibar.create(FILES, 0, {
    task: "DELETE       "
  })

  for (const f of uploaded) {
    const del = await fetch(
      "http://localhost:3000/api/files/delete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: f.fileId
        })
      }
    )

    if (!del.ok) {
      throw new Error(
        `Delete failed (${del.status})`
      )
    }
    deleteBar.increment()
  }

  deleteBar.stop()
  multibar.stop()
  console.log("\nBenchmark completed successfully.")
}

run().catch(console.error)