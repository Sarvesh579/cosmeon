import {FIFO} from "./policies/fifo"
import {LRU} from "./policies/lru"
import {LFU} from "./policies/lfu"
import {LRUK} from "./policies/lruk"

export const policies={
  fifo:new FIFO(),
  lru:new LRU(),
  lfu:new LFU(),
  lruk:new LRUK()
}

export const CACHE_TTL=1*60*1000