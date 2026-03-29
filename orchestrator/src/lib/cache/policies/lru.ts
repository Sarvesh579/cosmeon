import {CachePolicy,CacheEntry} from "./base"

export class LRU implements CachePolicy{
  name="LRU"
  recordAccess(entry:CacheEntry){
    entry.lastAccess=Date.now()
  }

  chooseEviction(entries:CacheEntry[]){
    const sorted=[...entries].sort(
      (a,b)=>a.lastAccess-b.lastAccess
    )
    return sorted[0].fileId
  }
}