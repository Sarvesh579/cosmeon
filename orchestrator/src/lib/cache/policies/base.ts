export type CacheEntry={
  fileId:string
  lastAccess:number
  frequency:number
  createdAt:number
}

export interface CachePolicy{
  name:string
  recordAccess(entry:CacheEntry):void
  chooseEviction(entries:CacheEntry[]):string
}