type MapEvent={
  type:"upload"|"download"|"redistribute"|"replicate"|"evict"|"delete"
  from:{lat:number,lon:number}
  to:{lat:number,lon:number}[]
  name?:string
}

type Listener=(e:MapEvent)=>void

const listeners=new Set<Listener>()

export function emitMapEvent(e:MapEvent){
  listeners.forEach(l=>l(e))
}

export function subscribeMapEvents(l:Listener){
  listeners.add(l)
  return ()=>{
    listeners.delete(l)
  }
}