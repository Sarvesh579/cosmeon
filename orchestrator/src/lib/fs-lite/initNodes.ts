import Node from "@/models/Node"
import { connectDB } from "@/lib/db"

export async function initNodes(){
  await connectDB()

  const nodes = [
    {nodeId:"ORBIT-1",url:"http://localhost:4001",rack:"alpha",capacity:100},
    {nodeId:"ORBIT-2",url:"http://localhost:4002",rack:"alpha",capacity:150},
    {nodeId:"ORBIT-3",url:"http://localhost:4003",rack:"beta",capacity:80},
    {nodeId:"ORBIT-4",url:"http://localhost:4004",rack:"beta",capacity:200},
    {nodeId:"ORBIT-5",url:"http://localhost:4005",rack:"gamma",capacity:120}
  ]

  for(const n of nodes){
    await Node.updateOne(
      { nodeId: n.nodeId },
      { $setOnInsert: { ...n, healthy: true, used: 0 } },
      { upsert: true }
    )
  }
}