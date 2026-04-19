import Node from "@/models/Node"
import axios from "axios"

export async function monitorNodes(){
  // CRITICAL: Only attempt to "monitor" and "fix" nodes that haven't been manually failed by the user.
  const nodes = await Node.find({ manualFailure: { $ne: true } })

  for(const node of nodes){
    try{
      const res = await axios.get(`${node.url}/health`, { timeout: 2000 })

      // NOTE: We do NOT overwrite node.used with chunkCount here.
      // node.used (bytes) is accurately managed by adaptiveReplication and initNodes.
      // Overwriting it with chunkCount (e.g. 5) breaks analytics which expects MB.
      await Node.updateOne(
        { _id: node._id },
        { 
          $set: { 
            healthy: true, 
            lastSeen: new Date() 
          } 
        }
      )

    } catch {
      await Node.updateOne(
        { _id: node._id },
        { $set: { healthy: false } }
      )
    }
  }
}