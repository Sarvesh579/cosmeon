import {CachePolicy,CacheEntry} from "./base"

export class LFU implements CachePolicy{
  name="LFU"
  recordAccess(entry:CacheEntry){
    entry.frequency++
  }

  chooseEviction(entries:CacheEntry[]){
    const sorted=[...entries].sort(
      (a,b)=>a.frequency-b.frequency
    )
    return sorted[0].fileId
  }
}