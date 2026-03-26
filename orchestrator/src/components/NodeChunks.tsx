"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

export default function NodeChunks({node}:{node:string}){
  const { data } = useSWR(`/api/nodeChunks?node=${node}`,fetcher)
  if(!data) return <div>Loading...</div>

  return(
    <ul className="text-sm mt-2">
      {data.map((c:any)=>(
        <li key={c}>{c}</li>
      ))}
    </ul>
  )
}