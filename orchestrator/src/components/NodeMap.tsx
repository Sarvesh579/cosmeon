"use client"
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } from "react-leaflet"
import L from "leaflet"
import { useEffect, useState } from "react"
import { subscribeMapEvents } from "@/lib/mapEvents"

type Node = {
  nodeId: string
  rack: string
  location: {
    lat: number
    lon: number
  }
}

type Dot = {
  lat:number
  lon:number
  target:{lat:number,lon:number}
}

type Props = {
  nodes: Node[]
  userLocation: { lat: number; lon: number }
  l1?: string
  l2?: string[]
}

const normalIcon = new L.Icon({
  iconUrl: "/node.png",
  iconSize: [26, 26]
})

const l1Icon = new L.Icon({
  iconUrl: "/node-l1.png",
  iconSize: [32, 32]
})

const l2Icon = new L.Icon({
  iconUrl: "/node-l2.png",
  iconSize: [28, 28]
})


export default function NodeMap({ nodes, userLocation, l1, l2 }: Props) {
  const [ dots, setDots ] = useState<Dot[]>([])

  useEffect(()=>{
    const unsub=subscribeMapEvents(e=>{
      const newDots=e.to.map(t=>({
        lat:e.from.lat,
        lon:e.from.lon,
        target:t
      }))
      setDots(d=>[...d,...newDots])
    })

    return ()=>{
      unsub()
    }
  },[])

  useEffect(()=>{
    const id=setInterval(()=>{
      setDots(dots=>{
        return dots.map(d=>{
          const dx=(d.target.lat-d.lat)*0.1
          const dy=(d.target.lon-d.lon)*0.1
          return{
            ...d,
            lat:d.lat+dx,
            lon:d.lon+dy
          }
        })
      })
    },60)
    return()=>clearInterval(id)
  },[])

  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lon]}
      zoom={9}
      style={{ height: "650px", width: "100%" }}
    >
    <TileLayer
      attribution="© CartoDB"
      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    />

      <CircleMarker
        center={[userLocation.lat, userLocation.lon]}
        radius={10}
        pathOptions={{ color: "blue" }}
      >
        <Popup>User</Popup>
      </CircleMarker>

      {nodes.map((node) => {
        let icon = normalIcon
        if (node.nodeId === l1) icon = l1Icon
        if (l2?.includes(node.nodeId)) icon = l2Icon

        return (
          <Marker
            key={node.nodeId}
            position={[node.location.lat, node.location.lon]}
            icon={icon}
          >
            <Popup>
              <div>
                <b>{node.nodeId}</b>
                <br/>
                Rack: {node.rack}
                <br/>
                {node.nodeId === l1 && "L1 Cache"}
                <br/>
                {l2?.includes(node.nodeId) && "L2 Cache"}
              </div>
            </Popup>
          </Marker>
        )
      })}
      {dots.map((d,i)=>(
        <CircleMarker
          key={i}
          center={[d.lat,d.lon]}
          radius={4}
          pathOptions={{color:"yellow"}}
        />
      ))}
    </MapContainer>
  )
}