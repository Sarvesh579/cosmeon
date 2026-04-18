import { adaptiveReplication } from "./adaptiveReplication"
import { selfHeal } from "./selfHeal"
import { monitorNodes } from "./nodeHealth"
import { handleNodeFailures } from "./failureHandler"
import { proofCheck } from "./proofCheck"
import { redistributeColdFiles } from "@/lib/cache/redistribute"

export function startScheduler(){
  setInterval(async()=>{
    await monitorNodes()
  }, 5000)

  setInterval(async()=>{
    await adaptiveReplication()
  }, 15000)

  setInterval(async()=>{
    await selfHeal()
  }, 45000)

  setInterval(async()=>{
    await handleNodeFailures()
  }, 30000)

  setInterval(async()=>{
    await proofCheck()
  }, 90000)

  // Every 30s: cool down files whose cache TTL (120s) has expired
  setInterval(async()=>{
    await redistributeColdFiles()
  }, 30000)
}