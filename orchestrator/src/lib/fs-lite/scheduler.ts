import { adaptiveReplication } from "./adaptiveReplication"
import { monitorNodes } from "./nodeHealth"
import { redistributeColdFiles } from "@/lib/cache/redistribute"

export function startScheduler(){
  // Monitor nodes every 5s (Respects manualFailure)
  setInterval(async()=>{
    await monitorNodes()
  }, 5000)

  // Adaptive Replication every 15s (Self-heals and balances)
  setInterval(async()=>{
    await adaptiveReplication()
  }, 15000)

  // Every 30s: cool down files whose cache TTL has expired
  setInterval(async()=>{
    await redistributeColdFiles()
  }, 30000)
}