"use client"
import NodeChunks from "@/components/NodeChunks"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { useState } from "react"
import dynamic from "next/dynamic"
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d"),
  { ssr: false }
)

export default function ClusterGraph(){
  const { data } = useSWR("/api/cluster", fetcher,{
    refreshInterval:5000
  })
  const [selected,setSelected] = useState<any>(null)
  if(!data) return <div>Loading...</div>
  const nodes = data.nodes.map((n:any)=>({
    id:n.nodeId
  }))

  const graph = {
    nodes,
    links:[]
  }

  return(
    <div className="h-full">
      <ForceGraph2D
        graphData={graph}
        nodeLabel="id"
        onNodeClick={setSelected}
      />

      {selected && (
        <div className="absolute top-4 right-4 bg-white border p-4">
          <h3>{selected.id}</h3>
          <NodeChunks node={selected.id} />
        </div>
      )}
    </div>
  )
}