import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import mongoose from "mongoose"

import { connectDB } from "@/lib/db"
import CacheMetrics from "@/models/CacheMetrics"
import File from "@/models/File"
import Folder from "@/models/Folder"
import Analytics from "@/models/Analytics"

const models = {
  cachemetrics: CacheMetrics,
  files: File,
  folders: Folder,
  analytics: Analytics
} as const

const rl = readline.createInterface({
  input,
  output
})

async function main() {
  try {
    let name = process.argv[2]?.toLowerCase()
    await connectDB()
    if (!name) {
      console.log("\nAvailable collections:")

      for (const [collectionName, Model] of Object.entries(models)) {
        const count = await Model.countDocuments()
        console.log(
          `  - ${collectionName} (${count} documents)`
        )
      }
      console.log(`  - all (cachemetrics + analytics + files + folders)`)
      console.log(`  or type "cancel" to exit.`)

      name = (
        await rl.question(
          "\nCollection to clear: "
        )
      )
        .trim()
        .toLowerCase()
    }

    if (name === "nodes") {
      console.log("Clearing 'nodes' collection is not allowed for safety reasons.")
      return
    }

    if (name === "none" || name === "cancel" || name === "exit") {
      console.log("Operation cancelled.")
      return
    }

    if (name === "all") {
      const collectionsToClear = [
        "cachemetrics",
        "analytics",
        "files",
        "folders"
      ] as const

      console.log("\nCollections to clear:")

      let totalDocuments = 0

      for (const collectionName of collectionsToClear) {
        const count =
          await models[collectionName].countDocuments()

        totalDocuments += count

        console.log(
          `  - ${collectionName} (${count} documents)`
        )
      }

      if (totalDocuments === 0) {
        console.log(
          "\nAll target collections are already empty."
        )
        return
      }

      const confirm = (
        await rl.question(
          `\nDelete ALL ${totalDocuments} documents across these collections? [yes/no]: `
        )
      )
        .trim()
        .toLowerCase()

      if (confirm !== "yes") {
        console.log("Operation cancelled.")
        return
      }

      console.log()

      for (const collectionName of collectionsToClear) {
        const result =
          await models[collectionName].deleteMany({})

        console.log(
          `Deleted ${result.deletedCount} documents from "${collectionName}".`
        )
      }

      console.log(
        "\nAll selected collections cleared."
      )

      return
    }

    const Model =
      models[name as keyof typeof models]

    if (!Model) {
      console.error(
        `Unknown collection "${name}"`
      )

      process.exitCode = 1
      return
    }

    const count = await Model.countDocuments()

    if (count === 0) {
      console.log(
        `Collection "${name}" is already empty.`
      )
      return
    }

    const confirm = (
      await rl.question(
        `Delete ALL ${count} documents from "${name}"? [y/N]: `
      )
    )
      .trim()
      .toLowerCase()

    if (
      confirm !== "y" &&
      confirm !== "yes"
    ) {
      console.log("Operation cancelled.")
      return
    }

    const result = await Model.deleteMany({})

    console.log(
      `Deleted ${result.deletedCount} documents from "${name}".`
    )
  }
  catch (err) {
    console.error("\nOperation failed:")
    console.error(err)
    process.exitCode = 1
  }
  finally {
    try {
      rl.close()
    } catch {}

    try {
      await mongoose.disconnect()
    } catch {}
  }
}

main()