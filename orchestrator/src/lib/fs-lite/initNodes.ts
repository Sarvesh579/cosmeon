import Node from "@/models/Node"

export async function initNodes(){

  const nodes = [
    {nodeId:"ORBIT-1",url:"http://localhost:4001",rack:"alpha",capacity:100},
    {nodeId:"ORBIT-2",url:"http://localhost:4002",rack:"alpha",capacity:150},
    {nodeId:"ORBIT-3",url:"http://localhost:4003",rack:"beta",capacity:80},
    {nodeId:"ORBIT-4",url:"http://localhost:4004",rack:"beta",capacity:200},
    {nodeId:"ORBIT-5",url:"http://localhost:4005",rack:"gamma",capacity:120}
  ]

  for(const n of nodes){

    const exists = await Node.findOne({nodeId:n.nodeId})

    if(!exists){
      await Node.create({...n,healthy:true,used:0})
    }
  }
}