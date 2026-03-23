import crypto from "crypto"

function hash(data: string) {
  return crypto.createHash("sha256").update(data).digest("hex")
}

export function buildMerkleRoot(hashes: string[]) {
  if (hashes.length === 0) return ""
  if (hashes.length === 1) return hashes[0]
  const nextLevel: string[] = []
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i]
    const right = hashes[i + 1] || left
    nextLevel.push(hash(left + right))
  }
  return buildMerkleRoot(nextLevel)
}