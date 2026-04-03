import { adaptiveReplication } from "./adaptiveReplication"
import { selfHeal } from "./selfHeal"
import { monitorNodes } from "./nodeHealth"
import { handleNodeFailures } from "./failureHandler"
import { proofCheck } from "./proofCheck"

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
}