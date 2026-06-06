import { adaptiveReplication } from "./adaptiveReplication"
import { monitorNodes } from "./nodeHealth"
import { redistributeColdFiles } from "@/lib/cache/redistribute"

export function startScheduler(){
  async function schedulerLoop() {
    while (true) {
      try {
        await monitorNodes()
        await adaptiveReplication()
        await redistributeColdFiles()
      } catch (err) {
        console.error(err)
      }

      await new Promise(
        r => setTimeout(r, 5000)
      )
    }
  }

  schedulerLoop()
}