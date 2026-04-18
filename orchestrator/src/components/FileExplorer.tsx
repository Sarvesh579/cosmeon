"use client"
import useSWR from "swr"
import { useRef, useState, useEffect, DragEvent } from "react"
import { emitMapEvent } from "@/lib/mapEvents"

import { Folder, FileText, Upload, Plus, LogOut, ChevronLeft, Trash2, Edit2, Download, Loader2, CheckCircle2, Flame, Snowflake } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

/** Shows a flame icon + live countdown until the file goes cold */
function HotBadge({ cacheExpiresAt }: { cacheExpiresAt: string | null }) {
  const [secsLeft, setSecsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!cacheExpiresAt) return
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(cacheExpiresAt).getTime() - Date.now()) / 1000))
      setSecsLeft(diff)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [cacheExpiresAt])

  return (
    <span className="flex items-center gap-1 text-[9px] text-amber-400 font-black tracking-widest uppercase">
      <Flame size={9} className="animate-pulse" />
      HOT{/*secsLeft !== null ? ` · ${secsLeft}s` : ""*/}
    </span>
  )
}


export default function FileExplorer() {
  const input = useRef<HTMLInputElement>(null)
  const [currentFolder, setCurrentFolder] = useState("/")
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<null | "started" | "processing" | "success">(null)
  const [latestFileName, setLatestFileName] = useState("")

  useEffect(() => {
    setUserId(localStorage.getItem("userId"))
    setUsername(localStorage.getItem("username"))
  }, [])

  const { data, mutate } = useSWR(
    userId ? `/api/files?folder=${currentFolder}` : null,
    (url: string) =>
      fetch(url, {
        headers: { "x-user": userId ?? "" }
      }).then(r => r.json())
  )

  const { data: folders } = useSWR(
    userId ? "/api/folders" : null,
    (url: string) =>
      fetch(url, {
        headers: { "x-user": userId ?? "" }
      }).then(r => r.json())
  )

  async function createFolder() {
    const name = prompt("Folder name")
    if (!name) return

    await fetch("/api/folders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user": userId ?? ""
      },
      body: JSON.stringify({
        name,
        parent: currentFolder
      })
    })
    mutate()
  }

  async function renameFolder(id: string) {
    const name = prompt("New folder name")
    if (!name) return

    await fetch("/api/folders/rename", {
      method: "POST",
      body: JSON.stringify({ id, name })
    })

    mutate()
  }

  async function deleteFolder(id: string) {
    if (!confirm("Delete this folder?")) return

    await fetch("/api/folders/delete", {
      method: "POST",
      body: JSON.stringify({ id })
    })

    mutate()
  }

  async function remove(id: string) {
    if (!confirm("Delete this file?")) return

    // Find the file to get its nodes for animation
    const file = data?.find((f: any) => f.id === id)
    if (file) {
      const nodes = JSON.parse(localStorage.getItem("cacheNodes") || "[]")
      if (nodes.length > 0) {
        emitMapEvent({
          type: "delete",
          from: nodes[0],
          to: nodes,
          name: file.name
        })
      }
    }

    await fetch("/api/files/delete", {
      method: "POST",
      body: JSON.stringify({ id })
    })
    mutate()
  }

  async function rename(id: string) {
    const name = prompt("New name")
    if (!name) return
    await fetch("/api/files/rename", {
      method: "POST",
      body: JSON.stringify({ id, name })
    })
    mutate()
  }

  async function uploadFile(file: File) {
    setLatestFileName(file.name)
    setUploadStatus("started")

    const buffer = await file.arrayBuffer()
    setUploadStatus("processing")

    await fetch("/api/fs/upload", {
      method: "POST",
      headers: {
        "x-filename": file.name,
        "x-folder": currentFolder,
        "x-user": localStorage.getItem("userId") ?? ""
      },
      body: buffer
    })

    setUploadStatus("success")
    setTimeout(() => setUploadStatus(null), 4000)

    mutate()

    const user = JSON.parse(localStorage.getItem("userLocation") || "null")
    const allNodes = JSON.parse(localStorage.getItem("allNodes") || "[]")
    const l1 = localStorage.getItem("l1")
    const l2 = JSON.parse(localStorage.getItem("l2") || "[]")

    if (user && allNodes.length > 0) {
      // STRICT FILTER: Only show initial upload stream going to GREY (Storage) nodes
      const storageNodeLocations = allNodes
        .filter((n: any) => n.nodeId !== l1 && !l2.includes(n.nodeId))
        .map((n: any) => n.location)

      if (storageNodeLocations.length > 0) {
        emitMapEvent({
          type: "upload",
          from: user,
          to: storageNodeLocations,
          name: file.name
        })
      }
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)

    const files = e.dataTransfer.files
    if (!files.length) return

    Array.from(files).forEach(f => uploadFile(f as File))
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
  }

  async function upload() {
    const file = input.current?.files?.[0]
    if (!file) return
    await uploadFile(file)
    if (input.current) input.current.value = ""
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`h-full flex flex-col p-6 overflow-x-hidden transition-colors duration-300 ${dragging ? "bg-accent/5 ring-2 ring-accent ring-inset" : ""}`}
    >
      {/* Upload Progress Popup */}
      <AnimatePresence>
        {uploadStatus && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] min-w-[300px]"
          >
            <div className="glass-panel p-4 rounded-2xl border-accent/40 shadow-2xl flex items-center gap-4 bg-zinc-950/80 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent ring-1 ring-accent/20">
                {uploadStatus === "success" ? (
                  <CheckCircle2 className="w-6 h-6 animate-bounce" />
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-0.5">
                  {uploadStatus === "started" && "Scanning Sector"}
                  {uploadStatus === "processing" && "Injecting Chunks"}
                  {uploadStatus === "success" && "Transmission Ready"}
                </p>
                <p className="text-sm text-white font-bold truncate max-w-[200px]">{latestFileName}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">COSMEON</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Protocol v4.0 • Core</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Operator</p>
            <p className="text-sm text-white font-bold tracking-tight">{username}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("userId")
              window.location.href = "/login"
            }}
            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 group"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-4 border-white/[0.03]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="file"
            ref={input}
            className="hidden"
            onChange={upload}
          />
          <button
            onClick={() => input.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-accent text-zinc-950 font-black uppercase tracking-tighter rounded-xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all text-xs shadow-xl shadow-accent/20"
          >
            <Upload size={16} strokeWidth={3} />
            Initialize Upload
          </button>
          <button
            onClick={createFolder}
            className="p-3.5 border border-white/10 rounded-xl text-zinc-500 hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentFolder !== "/" && (
            <button
              onClick={() => {
                const parts = currentFolder.split("/").filter(Boolean)
                parts.pop()
                const parent = parts.length ? "/" + parts.join("/") : "/"
                setCurrentFolder(parent)
              }}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-accent uppercase tracking-widest hover:bg-accent/10 rounded-xl transition-all border border-accent/20"
            >
              <ChevronLeft size={14} strokeWidth={3} />
              Step Back
            </button>
          )}

          <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            {currentFolder}
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto custom-scrollbar pr-2">
        <div className="grid gap-2">
          <AnimatePresence mode="popLayout">
            {/* Folders */}
            {folders
              ?.filter((f: any) => f.parent === currentFolder)
              .map((f: any, i: number) => (
                <motion.div
                  key={f._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between group cursor-default border-white/[0.01] hover:bg-white/[0.03]"
                >
                  <div
                    onClick={() => setCurrentFolder(currentFolder === "/" ? `/${f.name}` : `${currentFolder}/${f.name}`)}
                    className="flex items-center gap-4 cursor-pointer flex-1"
                  >
                    <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-amber-950 transition-all duration-500 shadow-lg">
                      <Folder size={22} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <div>
                      <span className="font-bold text-zinc-200 group-hover:text-white transition-colors block leading-none mb-1">{f.name}</span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Directory Hub</span>
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => renameFolder(f._id)} className="p-2.5 bg-white/5 rounded-lg text-zinc-500 hover:text-accent hover:bg-accent/10 transition-all"><Edit2 size={14} /></button>
                    <button onClick={() => deleteFolder(f._id)} className="p-2.5 bg-white/5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                  </div>
                </motion.div>
              ))}

            {/* Files */}
            {data?.map((f: any, i: number) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: (folders?.length || 0 + i) * 0.03 }}
                className="glass-card rounded-2xl p-4 flex items-center justify-between group border-white/[0.01] hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-3.5 rounded-xl bg-accent/10 text-accent group-hover:scale-110 group-hover:bg-accent group-hover:text-zinc-950 transition-all duration-500 shadow-lg">
                    <FileText size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-100 group-hover:text-white transition-colors leading-none mb-1.5">{f.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] text-zinc-500 font-black tracking-widest uppercase bg-white/5 px-2 py-0.5 rounded-md">{f.chunks} CHUNKS</p>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      {f.isHot ? (
                        <HotBadge cacheExpiresAt={f.cacheExpiresAt} />
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] text-blue-400/60 font-black tracking-widest uppercase">
                          <Snowflake size={9} />
                          COLD
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <a
                    onClick={() => {
                      const user = JSON.parse(localStorage.getItem("userLocation") || "null")
                      const cacheNodes = JSON.parse(localStorage.getItem("cacheNodes") || "[]")
                      const allNodes = JSON.parse(localStorage.getItem("allNodes") || "[]")

                      if (!user || !cacheNodes.length || !allNodes.length) return

                      const l1 = cacheNodes[0]

                      const nonCache = allNodes.find((n: any) =>
                        n?.location?.lat && n?.location?.lon &&
                        !cacheNodes.some((c: any) => c.lat === n.location.lat && c.lon === n.location.lon)
                      )

                      if (f.isHot) {
                        emitMapEvent({
                          type: "download",
                          from: l1,
                          to: [user],
                          name: f.name + " (Cache Hit)"
                        })
                      } else if (nonCache && nonCache.location) {
                        // stage 1: origin → cache
                        emitMapEvent({
                          type: "download",
                          from: nonCache.location,
                          to: [l1],
                          name: f.name + " (Storage → Cache)"
                        })

                        // stage 2: cache → user
                        // We set a 1200ms delay to give stage 1 time to animate into the cache node clearly
                        setTimeout(() => {
                          emitMapEvent({
                            type: "download",
                            from: l1,
                            to: [user],
                            name: f.name + " (Cache → User)"
                          })
                        }, 2200)
                      } else {
                        // fallback
                        emitMapEvent({
                          type: "download",
                          from: l1,
                          to: [user],
                          name: f.name
                        })
                      }
                    }}
                    href={`/api/fs/download?id=${f.id}`}
                    className="p-3 bg-white/5 rounded-xl text-zinc-500 hover:text-accent hover:bg-accent/10 transition-all border border-transparent hover:border-accent/20"
                  >
                    <Download size={18} strokeWidth={2.5} />
                  </a>
                  <button onClick={() => rename(f.id)} className="p-3 bg-white/5 rounded-xl text-zinc-500 hover:text-accent hover:bg-accent/10 transition-all border border-transparent hover:border-accent/20"><Edit2 size={18} /></button>
                  <button onClick={() => remove(f.id)} className="p-3 bg-white/5 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"><Trash2 size={18} /></button>
                </div>
              </motion.div>
            ))}

            {(!data?.length && !folders?.filter((f: any) => f.parent === currentFolder).length) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5 rotate-[15deg] group-hover:rotate-0 transition-transform duration-700">
                  <FileText size={40} className="text-zinc-800 -rotate-[15deg]" />
                </div>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Subsystem Clear</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}