"use client"
import useSWR from "swr"
import { useRef, useState, useEffect, DragEvent } from "react"

export default function FileExplorer() {
  const input = useRef<HTMLInputElement>(null)
  const [currentFolder, setCurrentFolder] = useState("/")
  const [userId,setUserId]=useState<string | null>(null)
  const [username,setUsername]=useState<string | null>(null)
  const [dragging,setDragging]=useState(false)

  useEffect(()=>{
    setUserId(localStorage.getItem("userId"))
    setUsername(localStorage.getItem("username"))
  },[])

  const { data, mutate } = useSWR(
    userId ? `/api/files?folder=${currentFolder}` : null,
    (url)=>
      fetch(url,{
        headers:{ "x-user":userId ?? "" }
      }).then(r=>r.json())
  )

  const { data: folders } = useSWR(
    userId ? "/api/folders" : null,
    (url)=>
      fetch(url,{
        headers:{ "x-user":userId ?? "" }
      }).then(r=>r.json())
  )

  async function createFolder() {
    const name = prompt("Folder name")
    if (!name) return

    await fetch("/api/folders",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-user":userId ?? ""
      },
      body:JSON.stringify({
        name,
        parent:currentFolder
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
    const buffer = await file.arrayBuffer()

    await fetch("/api/fs/upload", {
      method: "POST",
      headers: {
        "x-filename": file.name,
        "x-folder": currentFolder,
        "x-user":localStorage.getItem("userId") ?? ""
      },
      body: buffer
    })
    mutate()
  }

  function handleDrop(e:DragEvent<HTMLDivElement>){
    e.preventDefault()
    setDragging(false)

    const files=e.dataTransfer.files
    if(!files.length) return

    Array.from(files).forEach(uploadFile)
  }

  function handleDragOver(e:DragEvent<HTMLDivElement>){
    e.preventDefault()
  }

  function handleDragEnter(e:DragEvent<HTMLDivElement>){
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e:DragEvent<HTMLDivElement>){
    e.preventDefault()
    setDragging(false)
  }

  async function upload() {
    const file = input.current?.files?.[0]
    if (!file) return
    await uploadFile(file)
    input.current!.value = ""
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`p-8 max-w-5xl mx-auto ${dragging?"border-2 border-blue-500 bg-zinc-900":""}`}
    >

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-semibold">
          COSMEON Storage
        </div>

        <div className="text-sm text-gray-500">
          Hi {username}
        </div>

        <div className="text-sm text-gray-500">
          Drag & Drop files anywhere
        </div>

        <button
          onClick={()=>{
            localStorage.removeItem("userId")
            window.location.href="/login"
          }}
          className="text-red-400"
        >
          Logout
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <div className="text-gray-600">
          Root {currentFolder !== "/" && ` / ${currentFolder}`}
        </div>

        {currentFolder !== "/" && (
          <button
            onClick={() => {
              const parts = currentFolder.split("/").filter(Boolean)
              parts.pop()
              const parent = parts.length ? "/" + parts.join("/") : "/"
              setCurrentFolder(parent)
            }}
            className="text-blue-600 hover:underline"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <input
          type="file"
          ref={input}
          className="border rounded px-3 py-1 text-sm"
        />

        <button
          onClick={upload}
          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Upload
        </button>

        <button
          onClick={createFolder}
          className="px-4 py-1 border rounded hover:bg-gray-700 text-sm"
        >
          New Folder
        </button>
      </div>

      {/* File Area */}
      <div className="border rounded-lg overflow-hidden">
        {/* Folders */}
        {folders
          ?.filter((f: any) => f.parent === currentFolder)
          .map((f: any) => (
            <div
              key={f._id}
              className="flex items-center justify-between px-4 py-3 border-b hover:bg-gray-700"
            >

              <div
                onClick={() =>
                  setCurrentFolder(
                    currentFolder === "/"
                      ? `/${f.name}`
                      : `${currentFolder}/${f.name}`
                  )
                }
                className="flex items-center gap-3 cursor-pointer"
              >
                <span className="text-lg">📁</span>
                <span>{f.name}</span>
              </div>

              <div className="flex gap-4 text-sm">

                <button
                  onClick={() => renameFolder(f._id)}
                  className="text-blue-600 hover:underline"
                >
                  Rename
                </button>

                <button
                  onClick={() => deleteFolder(f._id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
        ))}
        
        {/* Files */}
        {data?.map((f: any) => (

          <div
            key={f.id}
            className="flex items-center justify-between px-4 py-3 border-b hover:bg-gray-700"
          >
            <div className="flex flex-col">
              <span className="font-medium">
                {f.name}
              </span>

              <span className="text-xs text-gray-500">
                {f.chunks} chunks
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <a
                href={`/api/fs/download?id=${f.id}`}
                className="text-blue-600 hover:underline"
              >
                Download
              </a>

              <button
                onClick={() => rename(f.id)}
                className="text-blue-600 hover:underline"
              >
                Rename
              </button>

              <button
                onClick={() => remove(f.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}