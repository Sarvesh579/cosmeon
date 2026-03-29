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
      .then(setData)
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