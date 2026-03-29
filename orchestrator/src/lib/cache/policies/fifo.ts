import {CachePolicy,CacheEntry} from "./base"

export class FIFO implements CachePolicy{
  name="FIFO"
  recordAccess(entry:CacheEntry){}

  chooseEviction(entries:CacheEntry[]){
    const sorted=[...entries].sort(
      (a,b)=>a.createdAt-b.createdAt
    )
    return sorted[0].fileId
  }
}