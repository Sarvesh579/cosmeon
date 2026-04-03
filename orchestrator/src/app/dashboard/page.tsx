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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* Left Sidebar: File Explorer */}
      <div className="w-2/5 border-r border-white/5 overflow-auto bg-zinc-950/20 backdrop-blur-sm">
        <FileExplorer/>
      </div>

      {/* Main Area: Real-time Map */}
      <div className="flex-1 relative bg-zinc-950">
        <DashboardMap/>
        
        {/* Subtle Bottom Overlay for Stats or Status */}
        <div className="absolute bottom-6 left-6 right-6 z-[1000] pointer-events-none">
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border-accent/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Cluster Engine</p>
                <p className="text-sm font-bold text-white uppercase tracking-tight">Status: Operational</p>
              </div>
            </div>
            
            <div className="flex gap-8 pr-4">
               <div><p className="text-[9px] font-bold text-zinc-500 uppercase">Latency</p><p className="text-xs font-mono text-emerald-400">12ms</p></div>
               <div><p className="text-[9px] font-bold text-zinc-500 uppercase">Availability</p><p className="text-xs font-mono text-emerald-400">99.9%</p></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}