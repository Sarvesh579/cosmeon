"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { useState, useEffect } from "react"
import {useRouter} from "next/navigation"
import ClusterAnimator from "@/components/ClusterAnimator"

export default function Visualize() {
  const router=useRouter()

  useEffect(()=>{
    const userId=localStorage.getItem("userId")
    if(!userId){
      router.replace("/login")
    }
  },[])
  
  const { data } = useSWR("/api/files", fetcher)
  const [file,setFile] = useState("")

  if(!data) return <div className="p-8">Loading files...</div>

  return (
    <div className="p-8 space-y-6">

      <select
        className="border px-4 py-2 rounded"
        value={file}
        onChange={(e)=>setFile(e.target.value)}
      >
        <option value="">Select a file</option>

        {data.map((f:any)=>(
          <option key={f.id} value={f.name}>
            {f.name}
          </option>
        ))}

      </select>

      {file && (
        <ClusterAnimator file={file}/>
      )}

    </div>
  )
}