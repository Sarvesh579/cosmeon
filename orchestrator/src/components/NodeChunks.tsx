"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { motion } from "framer-motion"

interface Chunk {
  chunkId: string
  file: string
  node: string
}

export default function NodeChunks({ node, isL1, isL2 }: { node: string, isL1?: boolean, isL2?: boolean }) {
  const { data } = useSWR(`/api/nodeChunks?node=${node}`, fetcher, {
    refreshInterval: 5000
  })

  // Theme colors
  const accentColor = isL1 ? "#2dd4bf" : isL2 ? "#f97316" : "#f97316" // Default to orange for theme consistency but turquoise for L1
  const badgeColor = isL1 ? "bg-[#2dd4bf]/20 text-[#2dd4bf] border-[#2dd4bf]/30" : isL2 ? "bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30" : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
  const dotColor = isL1 ? "bg-[#2dd4bf]" : isL2 ? "bg-[#f97316]" : "bg-zinc-700"

  if (!data) return (
    <div className="h-48 glass-panel animate-pulse rounded-2xl flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-2xl p-5 shadow-2xl hover:border-accent/40 transition-colors group "
    >
      {/* Node Header */}
      <div className="flex flex-col mb-5">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-2">Active Node</span>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white tracking-tighter uppercase">{node}</h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${badgeColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isL1 || isL2 ? 'animate-pulse' : ''} ${dotColor}`}></span>
            <span className="text-[9px] font-black uppercase tracking-widest">
              {isL1 ? "Primary L1" : isL2 ? "Secondary L2" : "Storage"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Capacity / Distribution Visualizer */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Payload Distribution</span>
            <span className="text-lg font-black text-white tracking-tighter">{data.length} CHUNKS</span>
          </div>
        </div>

        {/* List View (Scrollable) */}
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {data.map((c: Chunk, i: number) => (
            <motion.div
              key={`${c.chunkId}-${c.file}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center h-full justify-between glass-card rounded-xl px-4 py-3 group/item border border-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs text-zinc-200 truncate group-hover/item:text-white leading-none mb-1">
                  {c.file}
                </span>
                <span className="text-[9px] text-zinc-600 font-mono uppercase font-bold tracking-tighter">CHUNK ID: {c.chunkId.slice(0, 12)}</span>
              </div>

              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent/100" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}