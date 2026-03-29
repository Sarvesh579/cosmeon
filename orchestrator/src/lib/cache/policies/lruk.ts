import {CachePolicy,CacheEntry} from "./base"

export class LRUK implements CachePolicy{
  name="LRU-K"

  recordAccess(entry:CacheEntry){
    entry.lastAccess=Date.now()
    entry.frequency++
  }

  chooseEviction(entries:CacheEntry[]){
    const sorted=[...entries].sort(
      (a,b)=>{
        const scoreA=a.lastAccess+(a.frequency*1000)
        const scoreB=b.lastAccess+(b.frequency*1000)
        return scoreA-scoreB
      }
    )
    return sorted[0].fileId
  }
}