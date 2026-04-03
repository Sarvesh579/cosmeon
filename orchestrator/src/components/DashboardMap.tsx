"use client"
import {useEffect,useState} from "react"
import dynamic from "next/dynamic"

const NodeMap=dynamic(()=>import("@/components/NodeMap"),{ssr:false})

type Data={
  nodes:any[]
  userLocation:{lat:number,lon:number}
  l1?:string
  l2?:string[]
}

export default function DashboardMap(){
  const [data,setData]=useState<Data|null>(null)

  useEffect(()=>{
    const userId=localStorage.getItem("userId")
    if(!userId)return

    fetch(`/api/visualization?userId=${userId}`)
      .then(r=>r.json())
      .then(data=>{
        if(!data||!data.userLocation)return

        setData(data)

        localStorage.setItem("userLocation",JSON.stringify(data.userLocation))
        
        // Save ALL nodes for filtering later
        const allNodeData = data.nodes.map((n:any) => ({
          nodeId: n.nodeId,
          location: n.location
        }))
        localStorage.setItem("allNodes", JSON.stringify(allNodeData))

        // Specifically save cache node IDs
        localStorage.setItem("l1", data.l1 || "")
        localStorage.setItem("l2", JSON.stringify(data.l2 || []))

        const cacheNodes=data.nodes
          ?.filter((n:any)=>n.nodeId===data.l1||data.l2?.includes(n.nodeId))
          ?.map((n:any)=>n.location)||[]

        localStorage.setItem("cacheNodes",JSON.stringify(cacheNodes))
      })
  },[])

  if(!data){
    return <div className="p-4">Loading map...</div>
  }

  return(
    <NodeMap
      nodes={data.nodes}
      userLocation={data.userLocation}
      l1={data.l1}
      l2={data.l2}
    />
  )
}