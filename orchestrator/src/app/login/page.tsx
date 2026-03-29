"use client"
import {useState} from "react"
import {useRouter} from "next/navigation"

const cities={
  "Mumbai":{lat:19.0760,lon:72.8777},
  "Navi Mumbai":{lat:19.0330,lon:73.0297},
  "Panvel":{lat:18.9894,lon:73.1175},
  "Thane":{lat:19.2183,lon:72.9781},
  "Mira-Bhayandar":{lat:19.2952,lon:72.8544},
  "Vasai-Virar":{lat:19.3919,lon:72.8397},
  "Kalyan-Dombivli":{lat:19.2403,lon:73.1305}
}

export default function Login(){
  const router=useRouter()
  const [username,setUsername]=useState("")
  const [password,setPassword]=useState("")
  const [city,setCity]=useState("")
  const [mode,setMode]=useState<"login"|"signup">("login")
  const [error,setError]=useState("")

  async function submit(){
    const endpoint=mode==="login"?"/api/login":"/api/signup"
    const location=city?cities[city as keyof typeof cities]:null
    if(mode==="signup"&&!location){
      setError("Select a city")
      return
    }

    const res=await fetch(endpoint,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        username,
        password,
        location
      })
    })

    const data=await res.json()

    if(data.error){
      setError(data.error)
      return
    }

    localStorage.setItem("userId",data.userId)
    localStorage.setItem("username",username)

    router.push("/dashboard")
  }

  return(
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="w-80 space-y-4">
        <div className="text-xl text-center">
          COSMEON {mode==="login"?"Login":"Signup"}
        </div>

        <input
          placeholder="Username"
          value={username}
          onChange={e=>setUsername(e.target.value)}
          className="w-full border px-3 py-2 rounded bg-zinc-900"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded bg-zinc-900"
        />

        {mode==="signup"&&(
          <select
            value={city}
            onChange={e=>setCity(e.target.value)}
            className="w-full border px-3 py-2 rounded bg-zinc-900"
          >
            <option value="">Select City</option>
            {Object.keys(cities).map(c=>(
              <option key={c}>{c}</option>
            ))}
          </select>
        )}

        {error&&(
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          className="w-full bg-blue-600 py-2 rounded"
        >
          {mode==="login"?"Login":"Create Account"}
        </button>

        <button
          onClick={()=>setMode(mode==="login"?"signup":"login")}
          className="text-sm text-gray-400 w-full"
        >
          {mode==="login"?"Create new account":"Already have an account"}
        </button>
      </div>
    </div>
  )
}