"use client"
import dynamic from "next/dynamic"

const NodeMap = dynamic(() => import("./NodeMap"), {
  ssr: false
})

export default NodeMap