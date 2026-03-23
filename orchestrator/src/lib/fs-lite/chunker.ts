export function chunkBuffer(buffer: Buffer, chunkSize = 1024 * 1024) {
  const chunks = []

  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize))
  }

  return chunks
}