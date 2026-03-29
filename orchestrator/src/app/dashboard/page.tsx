"use client"

import {useEffect} from "react"
import {useRouter} from "next/navigation"
import FileExplorer from "@/components/FileExplorer"
import DashboardMap from "@/components/DashboardMap"

export default function Dashboard(){

  const router=useRouter()

  useEffect(()=>{
    const userId=localStorage.getItem("userId")
    if(!userId){
      router.replace("/login")
    }
  },[])

  return(
    <div className="flex h-screen">

      <div className="w-1/2 border-r overflow-auto">
        <FileExplorer/>
      </div>

      <div className="w-1/2">
        <DashboardMap/>
      </div>

    </div>
  )
}