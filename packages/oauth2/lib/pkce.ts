import { Base64Url } from '@guarani/utils'

import { createHash } from 'crypto'

function plain(challenge: string, verifier: string): boolean {
  return challenge === verifier
}

function S256(challenge: string, verifier: string): boolean {
  const hashed = createHash('sha256').update(verifier, 'ascii').digest()
  return challenge === Base64Url.encode(hashed)
}

export type PKCEMethod = (challenge: string, verifier: string) => boolean

export const PKCEMethods: Record<string, PKCEMethod> = { plain, S256 }
