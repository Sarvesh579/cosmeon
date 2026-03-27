"use client"

import FileExplorer from "@/components/FileExplorer"

export default function Dashboard(){
  return(
      <div className="p-4 overflow-auto">
        <FileExplorer />
      </div>
  )
}