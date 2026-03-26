import crypto from "crypto"

export function contentDefinedChunk(buffer: Buffer) {
  const chunks: Buffer[] = []
  const window = 48
  const mask = (1 << 13) - 1
  const min = 64 * 1024
  const max = 1024 * 1024

  let start = 0
  let hash = 0

  for (let i = 0; i < buffer.length; i++) {
    hash = ((hash << 1) + buffer[i]) & 0xffffffff
    const size = i - start

    if (
      size >= min &&
      ((hash & mask) === 0 || size >= max)
    ) {
      chunks.push(buffer.slice(start, i))
      start = i
      hash = 0
    }
  }

  if (start < buffer.length) {
    chunks.push(buffer.slice(start))
  }

  return chunks
}