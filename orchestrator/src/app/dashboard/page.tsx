"use client"

import FileExplorer from "@/components/FileExplorer"
import ClusterGraph from "@/components/ClusterGraph"

export default function Dashboard(){

  return(

    <div className="flex h-screen">

      <div className="w-1/3 border-r p-4 overflow-auto">
        <FileExplorer />
      </div>

      <div className="w-2/3 p-4">
        <ClusterGraph />
      </div>

    </div>

  )

}