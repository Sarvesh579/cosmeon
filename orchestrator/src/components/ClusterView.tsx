"use client"

import NodeChunks from "./NodeChunks"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

export default function ClusterView() {
  const { data } = useSWR("/api/cluster", fetcher, {
    refreshInterval: 5000
  })

  if (!data)
    return (
      <div className="p-8 text-zinc-400">
        Loading cluster...
      </div>
    )

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          Storage Cluster
        </h1>

        <div className="text-sm text-zinc-400">
          {data.nodes.length} nodes
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.nodes.map((node: any) => (
          <NodeChunks
            key={node.nodeId}
            node={node.nodeId}
          />
        ))}
      </div>
    </div>
  )
}