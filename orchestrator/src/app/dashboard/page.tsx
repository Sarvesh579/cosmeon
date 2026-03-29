"use client"

import {useEffect} from "react"
import {useRouter} from "next/navigation"
import FileExplorer from "@/components/FileExplorer"

export default function Dashboard(){

  const router=useRouter()

  useEffect(()=>{
    const userId=localStorage.getItem("userId")
    if(!userId){
      router.replace("/login")
    }
  },[])

  return(
    <div>
      <FileExplorer/>
    </div>
  )
}