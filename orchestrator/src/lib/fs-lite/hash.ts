import crypto from "crypto"

export function sha256(data: Buffer) {
  return crypto.createHash("sha256").update(data).digest("hex")
}