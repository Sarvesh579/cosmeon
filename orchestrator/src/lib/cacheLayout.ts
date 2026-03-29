import {distance} from "./distance"

export function computeCache(user, nodes){

  const sorted=[...nodes].sort(
    (a,b)=>
    distance(user.location,a.location)-
    distance(user.location,b.location)
  )

  return{
    L1:sorted[0].nodeId,
    L2:[
      sorted[1].nodeId,
      sorted[2].nodeId
    ]
  }
}