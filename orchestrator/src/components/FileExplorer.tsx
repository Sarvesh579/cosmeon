"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { useRef } from "react"

export default function FileExplorer(){
  const { data, mutate } = useSWR("/api/files", fetcher)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(){
    const file = inputRef.current?.files?.[0]
    if(!file) return
    const buffer = await file.arrayBuffer()

    await fetch("/api/fs/upload",{
      method:"POST",
      headers:{
        "x-filename":file.name
      },
      body:buffer
    })
    mutate()
  }

  return(
    <div>
      <h2 className="text-xl mb-4">Files</h2>
      <input type="file" ref={inputRef}/>
      <button onClick={upload} className="ml-2 border px-2">
        Upload
      </button>

      <ul className="mt-6 space-y-2">
        {data?.map((f:any)=>(
          <li key={f._id}>
            {f.filename}
            <a
              href={`/api/fs/download?id=${f._id}`}
              className="ml-3 text-blue-600"
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}