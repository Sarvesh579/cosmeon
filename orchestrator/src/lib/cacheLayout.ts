import {distance} from "./distance"

export function computeCache(user, nodes){

  const cacheNodes = nodes.filter(
    n => n.storageType === "cache"
  )

  const sorted=[...cacheNodes].sort(
    (a,b)=>
    distance(user.location,a.location)-
    distance(user.location,b.location)
  )

  if(sorted.length < 3){
    throw new Error(
      "Need at least 3 cache nodes. Not getting enough."
    )
  }

  return{
    L1:sorted[0].nodeId,
    L2:[
      sorted[1].nodeId,
      sorted[2].nodeId
    ]
  }
}