"use client"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

export default function Nodes() {

  const { data } = useSWR("/api/cluster", fetcher, {
    refreshInterval: 5000
  })

  if (!data) return <div>Loading...</div>
  return (
    <div className="p-10">
      <h1 className="text-3xl mb-6">Storage Nodes</h1>
      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th>Node</th>
            <th>Rack</th>
            <th>Used</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.nodes.map((n:any)=>(
            <tr key={n.nodeId} className="border-b">
              <td>{n.nodeId}</td>
              <td>{n.rack}</td>
              <td>{n.used}</td>
              <td>
                {n.healthy
                  ? "🟢 Healthy"
                  : "🔴 Down"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}