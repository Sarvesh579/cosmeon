"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"

type Chunk = {
  chunkId: string
  index: number
  nodes: string[]
}

type Node = {
  nodeId: string
  rack: string
  healthy: boolean
}

export default function ClusterAnimator({ file }: { file: string }) {

  const { data } = useSWR(
    file ? `/api/visualize?file=${file}` : null,
    fetcher
  )

  const [animate,setAnimate] = useState(false)
  const [reconstruct,setReconstruct] = useState(false)
  const [corrupt,setCorrupt] = useState(false)
  const [replicate,setReplicate] = useState(false)

  const nodes: Node[] = data?.nodes ?? []
  const chunks: Chunk[] = data?.chunks ?? []

  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [nodePositions,setNodePositions] = useState<Record<string,{x:number,y:number}>>({})
  const targetNodeId = "ORBIT-5"
  const targetPos = nodePositions?.[targetNodeId]

  /* animation timing */
  const TOTAL_TIME = 20
  const totalParticles = chunks.reduce((s,c)=>s+c.nodes.length,0)
  const delayStep = Math.min(0.35, TOTAL_TIME / totalParticles)
  const particleDuration = Math.min(1.2, TOTAL_TIME / totalParticles * 2)
  const containerRef = useRef<HTMLDivElement | null>(null)

  /* chunk colour palette */
  const colors = [
    "#60a5fa",
    "#34d399",
    "#f472b6",
    "#fbbf24",
    "#a78bfa",
    "#22d3ee"
  ]


  /* rack grouping */
  const racks = Array.from(
    new Set(nodes.map(n=>n.rack))
  )

  useEffect(()=>{
    if(!containerRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const positions:Record<string,{x:number,y:number}> = {}

    nodes.forEach(node=>{
      const el = nodeRefs.current[node.nodeId]
      if(!el) return
      const rect = el.getBoundingClientRect()
      positions[node.nodeId] = {
        x: rect.left - containerRect.left + rect.width/2,
        y: rect.top - containerRect.top + rect.height/2
      }

    })
    setNodePositions(positions)
  },[nodes])


  
  if (!data || !data.chunks || !data.nodes)
    return <div className="p-6">Loading animation...</div>


  return (
    <div
      ref={containerRef}
      className="w-full h-[640px] relative rounded-xl bg-gradient-to-b from-zinc-950 to-black border border-zinc-800 overflow-hidden text-white"
    >
      {/* controls */}
      <div className="absolute top-4 left-4 z-20 flex gap-3">

        <button
          onClick={()=>{setAnimate(true);setReconstruct(false)}}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg"
        >
          Animate Upload
        </button>

        <button
          onClick={()=>{setReconstruct(true);setAnimate(false)}}
          className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg"
        >
          Animate Download
        </button>

        <button
          onClick={()=>setCorrupt(true)}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg"
        >
          Simulate Corruption
        </button>

        <button
          onClick={async ()=>{
            setReplicate(true)

            await fetch("/api/adaptiveReplication",{
              method:"POST",
              headers:{
                "Content-Type":"application/json"
              },
              body:JSON.stringify({
                filename:data.file
              })
            })
          }}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg"
        >
          Simulate Adaptive Replication
        </button>

      </div>


      {/* FILE */}
      <motion.div
        className="absolute top-24 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-2 rounded-lg font-semibold shadow-lg"
        initial={{scale:1}}
        animate={animate ? {scale:0.7} : reconstruct ? {scale:1} : {}}
        transition={{type:"spring",stiffness:200}}
      >
        {data.file}
      </motion.div>


      {/* RACKS */}
      <div className="absolute bottom-10 w-full flex gap-6 px-10 items-stretch">
        {racks.map((rack)=>{
          const rackNodes = nodes.filter(n=>n.rack===rack)
          return(
            <div
              key={rack}
              className="flex-1 flex flex-col items-center gap-6 border border-zinc-800 p-6 rounded-lg bg-zinc-900/40"
            >
              <div className="text-xs text-zinc-400">
                {rack}
              </div>
              <div className="flex w-full justify-around">
                {rackNodes.map(node=>{
                  const nodeChunks = chunks.filter(c =>
                    c.nodes.includes(node.nodeId)
                  )
                  const failed =
                    corrupt &&
                    node.nodeId === nodes[0].nodeId

                  return(
                    <motion.div
                      key={node.nodeId}
                      ref={(el) => {
                        nodeRefs.current[node.nodeId] = el
                      }}
                      className={`relative w-24 h-24 rounded-full border flex items-center justify-center text-xs
                      ${failed ? "bg-red-900 border-red-500" : "bg-zinc-900 border-zinc-700"}`}
                    >
                      {node.nodeId}

                      {/* chunk stack */}
                      <div className="absolute bottom-[-14px] flex gap-1">
                        {nodeChunks.slice(0,4).map((c)=>{
                          const color =
                            colors[c.index % colors.length]

                          return(
                            <div
                              key={c.chunkId}
                              className="w-3 h-3 rounded"
                              style={{background:color}}
                            />
                          )
                        })}

                      </div>

                    </motion.div>
                  )

                })}

              </div>

            </div>
          )

        })}

      </div>


      {/* CHUNK PARTICLES */}
      {chunks.map((chunk,i)=>{

        const color = colors[chunk.index % colors.length]

        return chunk.nodes.map((nodeId,rIndex)=>{

          const nodeIndex = nodes.findIndex(
            n=>n.nodeId === nodeId
          )

          const pos = nodePositions[nodeId]

          /* explosion spread */
          const spreadX = (Math.random()-0.5)*200
          const spreadY = (Math.random()-0.5)*80

          return(
            <motion.div
              key={`${chunk.chunkId}-${nodeId}`}
              className="absolute w-6 h-6 rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold text-black"
              style={{background:color}}
              initial={{
                top:140,
                left:"50%",
                opacity:0,
                scale:0.4
              }}
              animate={
                animate
                ? {
                    top: pos?.y ?? 440,
                    left: pos?.x ?? "50%",
                    opacity:1,
                    scale:1
                  }
                : reconstruct
                ? {
                    top:140,
                    left:"50%",
                    opacity:1
                  }
                : {
                    top:140 + spreadY,
                    left:`calc(50% + ${spreadX}px)`,
                    opacity:1
                  }
              }
              transition={{
                delay: reconstruct
                  ? i*delayStep
                  : (i+rIndex)*delayStep,
                duration:particleDuration,
                type:"spring",
                stiffness:150
              }}
            >
              {chunk.index}
            </motion.div>
          )

        })

      })}


      {/* adaptive replication */}
      {replicate && targetPos && chunks.map((chunk,i)=>{
        // randomly choose one existing replica node
        const sourceNode =
          chunk.nodes[Math.floor(Math.random()*chunk.nodes.length)]
        const sourcePos = nodePositions[sourceNode]
        if(!sourcePos) return null
        const color = colors[chunk.index % colors.length]
        return(
          <motion.div
            key={"replica-"+chunk.chunkId}
            className="absolute w-6 h-6 rounded-full shadow-lg flex items-center justify-center text-[10px] font-bold text-black"
            style={{background:color}}

            initial={{
              top: sourcePos.y,
              left: sourcePos.x,
              scale:0.8,
              opacity:0.9
            }}
            animate={{
              top: targetPos.y,
              left: targetPos.x,
              scale:1,
              opacity:1
            }}
            transition={{
              delay: i * delayStep,
              duration: particleDuration,
              type: "spring",
              stiffness: 90
            }}
          >
            {chunk.index}
          </motion.div>
        )
      })}

    </div>
  )
}