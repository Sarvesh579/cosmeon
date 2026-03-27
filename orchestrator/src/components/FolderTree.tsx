"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"

export default function FolderTree({setFolder}:any){
  const {data} = useSWR("/api/folders",fetcher)
  if(!data) return null
  return(
    <div>
      <div
        className="cursor-pointer"
        onClick={()=>setFolder("/")}
      >
        Root
      </div>

      {data.map((f:any)=>(
        <div
          key={f._id}
          className="ml-4 cursor-pointer"
          onClick={()=>setFolder(f.name)}
        >
          {f.name}
        </div>
      ))}
    </div>
  )
}