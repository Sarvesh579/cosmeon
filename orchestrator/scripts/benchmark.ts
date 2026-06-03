import axios from "axios"
import crypto from "crypto"

const FILES = 50 // Number of files to upload/download/delete in the benchmark

function RandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

async function run(){
  const uploaded = []

  for(let i=0; i<FILES; i++) {
    const data = crypto.randomBytes(1024*RandomInt(100, 1024)) 

    const res=await fetch(
      "http://localhost:3000/api/fs/upload",
      {
        method:"POST",
        headers:{
          "x-filename":
            `bench-${i}.bin`,
          "x-user":
            "69cfffee616f420dbf6f354c"
        },
        body:data
      }
    )
    console.log(
      "Upload status:",
      res.status,
      res.statusText
    )

    const result = await res.json()
    console.log(result)
    uploaded.push(result)
  }

  console.log("UPLOAD DONE")

  for(const f of uploaded){
    const down = await fetch(
      `http://localhost:3000/api/fs/download?id=${f.fileId}`
    )
    console.log(
      "COLD DOWNLOAD",
      f.fileId,
      down.status
    )
  }

  console.log("COLD DOWNLOAD DONE")

  for(const f of uploaded){
    const down = await fetch(
      `http://localhost:3000/api/fs/download?id=${f.fileId}`
    )
    console.log(
      "HOT DOWNLOAD",
      f.fileId,
      down.status
    )
  }

  console.log("HOT DOWNLOAD DONE")

  for(const f of uploaded){
    const del = await fetch(
      "http://localhost:3000/api/files/delete",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          id:f.fileId
        })
      }
    )
    console.log(
      "DELETE",
      f.fileId,
      del.status
    )
  }

  console.log("DELETE DONE")
}
run()