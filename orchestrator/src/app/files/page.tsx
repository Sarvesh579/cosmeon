"use client"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

export default function Files(){
  const { data } = useSWR("/api/files", fetcher)
  if(!data) return <div>Loading...</div>
  return(
    <div className="p-10">
      <h1 className="text-3xl mb-6">Stored Files</h1>
      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th>Name</th>
            <th>Size</th>
            <th>Chunks</th>
            <th>Access</th>
          </tr>
        </thead>
        <tbody>
          {data.map((f:any)=>(
            <tr key={f._id} className="border-b">
              <td>{f.filename}</td>
              <td>{f.size}</td>
              <td>{f.chunks.length}</td>
              <td>{f.accessCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}