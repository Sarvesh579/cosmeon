"use client"
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet"
import L from "leaflet"
import { useEffect, useState, useRef } from "react"
import { subscribeMapEvents } from "@/lib/mapEvents"
import { motion, AnimatePresence } from "framer-motion"

type Node = {
  nodeId: string
  rack: string
  location: {
    lat: number
    lon: number
  }
  healthy?: boolean
}

type Dot = {
  id: string
  start: { lat: number; lon: number }
  target: { lat: number; lon: number }
  type: string
  name?: string
  progress: number // 0 to 1
}

type Props = {
  nodes: Node[]
  userLocation: { lat: number; lon: number }
  l1?: string
  l2?: string[]
}

// Custom DivIcons for high-tech look
const createUserIcon = () => L.divIcon({
  className: "custom-user-icon",
  html: `<div class="relative w-10 h-10 flex items-center justify-center">
    <div class="absolute inset-0 bg-[#2dd4bf]/40 rounded-full animate-ping opacity-60"></div>
    <div class="absolute inset-0 bg-[#2dd4bf]/10 rounded-full blur-xl"></div>
    <div class="w-5 h-5 bg-[#2dd4bf] rounded-full border-2 border-white shadow-[0_0_25px_rgba(45,212,191,1)] z-50"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
})

const createNodeIcon = (type: "normal" | "l1" | "l2" | "failed") => {
  let color = type === "l1" ? "#2dd4bf" : type === "l2" ? "#f97316" : "#8a8a9a"
  let glow = type === "l1" ? "rgba(45,212,191,0.5)" : type === "l2" ? "rgba(249,115,22,0.5)" : "rgba(39,39,42,0.3)"

  if (type === "failed") {
    color = "#ef4444" // red
    glow = "rgba(239,68,68,0.7)"
  }

  const stroke = type === "normal" ? "#3f3f46" : color

  return L.divIcon({
    className: `custom-node-icon-${type}`,
    html: `<div class="relative w-8 h-8 flex items-center justify-center group">
      <div class="absolute inset-0 bg-${type === "failed" ? "red-500" : "zinc-500"}/20 rounded-full blur-lg ${type === 'failed' ? 'animate-pulse' : ''}"></div>
      <svg viewBox="0 0 100 100" class="w-6 h-6 drop-shadow-[0_0_8px_${glow}]">
        <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" fill="${color}" fill-opacity="${type === "normal" ? "0.1" : "0.2"}" stroke="${stroke}" stroke-width="8" />
        <path d="M50 25 L75 40 L75 60 L50 75 L25 60 L25 40 Z" fill="${color}" class="${type !== "normal" ? "animate-pulse" : ""}" />
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

export default function NodeMap({ nodes, userLocation, l1, l2 }: Props) {
  const [dots, setDots] = useState<Dot[]>([])
  const [activeTransfers, setActiveTransfers] = useState<{ name: string, type: string }[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const unsub = subscribeMapEvents(e => {
      const targets = e.to

      // Multi-packet "Stream" Logic
      const packetsPerTarget = 5
      const delayBetweenPackets = 150

      targets.forEach(t => {
        for (let i = 0; i < packetsPerTarget; i++) {
          setTimeout(() => {
            setDots(prev => [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              start: { lat: e.from.lat, lon: e.from.lon },
              target: t,
              type: e.type,
              name: e.name,
              progress: 0
            }])
          }, i * delayBetweenPackets)
        }
      })

      if (e.name) {
        setActiveTransfers(prev => [...prev.filter(at => at.name !== e.name), { name: e.name || "Unknown", type: e.type }])
        setTimeout(() => {
          setActiveTransfers(prev => prev.filter(at => at.name !== e.name))
        }, 5000)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        const next = prev.map(d => {
          // Linear progression for consistent velocity
          const newProgress = d.progress + 0.015
          return { ...d, progress: newProgress }
        }).filter(d => d.progress < 1)
        return next
      })
    }, 40)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return <div className="h-full w-full bg-zinc-950 flex items-center justify-center font-mono text-xs text-zinc-800 uppercase tracking-widest">Initializing Protocol...</div>

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden glass-panel">
      {/* Map Content */}
      <MapContainer
        center={[userLocation.lat, userLocation.lon]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution="© CartoDB"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <Marker
          position={[userLocation.lat, userLocation.lon]}
          icon={createUserIcon()}
          zIndexOffset={1000}
        >
          <Popup>User Agent</Popup>
        </Marker>

        {nodes.map((node) => {
          let nodeType: "normal" | "l1" | "l2" | "failed" = "normal"
          if (node.healthy === false) nodeType = "failed"
          else if (node.nodeId === l1) nodeType = "l1"
          else if (l2?.includes(node.nodeId)) nodeType = "l2"

          return (
            <Marker
              key={node.nodeId}
              position={[node.location.lat, node.location.lon]}
              icon={createNodeIcon(nodeType)}
            >
              <Popup>
                <div className="p-1">
                  <h3 className={`font-bold ${nodeType === 'failed' ? 'text-red-500' : 'text-accent'}`}>{node.nodeId}</h3>
                  <p className="text-xs text-zinc-400">Rack: {node.rack}</p>
                  <p className={`text-[10px] uppercase font-bold ${nodeType === 'failed' ? 'text-red-500' : 'text-accent'}`}>
                    {nodeType === 'failed' ? "NODE OFFLINE" : nodeType !== "normal" ? `${nodeType} Cache Active` : "Storage Node Operational"}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {dots
          .filter(d =>
            d?.start?.lat && d?.start?.lon &&
            d?.target?.lat && d?.target?.lon
          )
          .map((d) => {
            let color = "#f97316" // orange for upload
            if (d.type === "download") color = "#8b5cf6" // violet
            if (d.type === "replicate") color = "#fbbf24" // amber
            if (d.type === "evict") color = "#ef4444" // red
            if (d.type === "delete") color = "#b91c1c" // dark red
            if (d.type === "cooldown") color = "#60a5fa" // ice blue

            // Linear Interp for packets
            if (!d.start?.lat || !d.start?.lon || !d.target?.lat || !d.target?.lon) return null
            const currentLat = d.start.lat + (d.target.lat - d.start.lat) * d.progress
            const currentLon = d.start.lon + (d.target.lon - d.start.lon) * d.progress

            // For delete, we show a pulse at the location
            if (d.type === "delete") {
              return (
                <CircleMarker
                  key={d.id}
                  center={[currentLat, currentLon]}
                  radius={10 + d.progress * 30}
                  pathOptions={{
                    color,
                    fill: false,
                    opacity: 1 - d.progress,
                    weight: 2
                  }}
                />
              )
            }

            // Cooldown: icy expanding ring that fades as it travels cache → storage
            if (d.type === "cooldown") {
              return (
                <CircleMarker
                  key={d.id}
                  center={[currentLat, currentLon]}
                  radius={6 + d.progress * 10}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: (1 - d.progress) * 0.35,
                    opacity: 1 - d.progress * 0.6,
                    weight: 2.5
                  }}
                />
              )
            }

            return (
              <CircleMarker
                key={d.id}
                center={[currentLat, currentLon]}
                radius={d.type === "download" ? 7 : 4 + d.progress * 4}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 1 - d.progress,
                  weight: d.type === "download" ? 3 : 2,
                  className: d.type === "download" ? "glow-download" : d.type === "upload" ? "glow-upload" : ""
                }}
              />
            )
          })}
      </MapContainer>

      {/* Overlay UI */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="px-4 py-2 glass-card rounded-full flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${nodes.some(n => n.healthy === false) ? 'bg-red-500 animate-pulse' : 'bg-accent animate-pulse'}`}></div>
          <span className="text-xs font-mono tracking-wider text-zinc-300">
            cluster STATUS: {nodes.some(n => n.healthy === false) ? 'DEGRADED' : 'NOMINAL'}
          </span>
        </div>

        <AnimatePresence>
          {activeTransfers.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
              className={`px-4 py-3 glass-card rounded-xl flex flex-col border-l-4 shadow-xl ${t.type === "cooldown" ? "border-l-blue-400" :
                t.type === "download" ? "border-l-violet-500" :
                  t.type === "delete" ? "border-l-red-600" :
                    "border-l-accent"
                }`}
            >
              <span className={`text-[10px] uppercase font-black tracking-widest ${t.type === "cooldown" ? "text-blue-400" :
                t.type === "download" ? "text-violet-400" :
                  t.type === "delete" ? "text-red-500" :
                    "text-accent"
                }`}>{t.type === "cooldown" ? "❄ COOLING" : t.type}</span>
              <span className="text-xs text-white font-medium truncate max-w-[180px]">{t.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="absolute top-4 right-4 z-[1000] p-4 glass-panel rounded-2xl space-y-2 text-[10px] text-zinc-500 font-bold tracking-tight border-white/5 shadow-2xl">
        <div className="flex items-center gap-3"><div className="w-3 h-3 bg-[#2dd4bf] rounded-sm shadow-[0_0_8px_rgba(45,212,191,0.6)]"></div> L1 PRIMARY CACHE</div>
        <div className="flex items-center gap-3"><div className="w-3 h-3 bg-[#f97316] rounded-sm shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div> L2 SECONDARY CACHE</div>
        <div className="flex items-center gap-3"><div className="w-3 h-3 bg-white/10 border border-white/20 rounded-sm"></div> STORAGE NODE</div>
        <div className="flex items-center gap-3"><div className="w-3 h-3 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div> FAILED NODE</div>
        <div className="flex items-center gap-3"><div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div> UPLOAD STREAM</div>
        <div className="flex items-center gap-3"><div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse"></div> DOWNLOAD STREAM</div>
      </div>
    </div>
  )
}
