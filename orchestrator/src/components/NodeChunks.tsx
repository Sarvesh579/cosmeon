"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

type Chunk = {
  chunkId: string
  file: string
  index: number
  userId: string
}

export default function NodeChunks({ node }: { node: string }) {
  const { data } = useSWR(
    `/api/nodeChunks?node=${node}`,
    url => fetch(url).then(r => r.json())
  )
  if (!data) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      {/* Node Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-white">{node}</h3>

        <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400">
          active
        </span>
      </div>

      {/* Chunk List */}
      <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
        {data.map((c) => (
          <div
            key={c.chunkId}
            className="flex items-center justify-between bg-zinc-800/50 hover:bg-zinc-800 transition rounded-md px-3 py-2 text-sm"
          >
            <span className="font-medium text-white truncate">
              {c.file}
            </span>

            <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">
              #{c.index}
            </span>

            <span className="text-xs text-zinc-400 font-mono">
              {c.chunkId.slice(0, 8)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 text-xs text-zinc-500">
        {data.length} chunks stored
      </div>
    </div>
  )
}