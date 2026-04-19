"use client"

import { useState, useEffect } from "react"

import NodeChunks from "./NodeChunks"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function ClusterView() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const { data } = useSWR("/api/cluster", fetcher, {
    refreshInterval: 5000
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || !data)
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
          <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Initializing Cluster...</p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-background p-8 lg:p-12 space-y-12 overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
            STORAGE <span className="text-accent underline decoration-white/10 underline-offset-8">Constellation</span>
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide uppercase text-sm">Real-time Node Observability & Chunk Distribution</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="glass-panel px-6 py-3 rounded-2xl border-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="flex items-center gap-4 glass-panel px-6 py-3 rounded-2xl border-white/10">
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-500 uppercase leading-none mb-1">Cluster Density</p>
              <p className="text-xl font-bold text-white tracking-tighter">
                {data.nodes.filter((n: any) => n.healthy).length} ONLINE NODES
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 auto-rows-fr">
        {data.nodes.map((node: any, i: number) => {
          const l1 = data.l1 === node.nodeId
          const l2 = data.l2?.includes(node.nodeId)
          return (
            <motion.div
              key={node.nodeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <NodeChunks
                node={node.nodeId}
                isL1={l1}
                isL2={l2}
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}