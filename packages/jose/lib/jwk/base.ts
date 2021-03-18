/* eslint-disable camelcase */

import { Objects } from '@guarani/utils'

import { KeyObject } from 'crypto'

import { InvalidKey } from '../exceptions'

export interface KeyOptions {
  kty?: string
  use?: string
  key_ops?: string[]
  alg?: string
  kid?: string
  x5u?: string
  x5c?: string[]
  x5t?: string
  'x5t#S256'?: string

  [key: string]: any
}

export abstract class JsonWebKey {
  public abstract readonly kty: string
  public readonly use?: string
  public readonly key_ops?: string[]
  public readonly alg?: string
  public readonly kid?: string
  public readonly x5u?: string
  public readonly x5c?: string[]
  public readonly x5t?: string
  public readonly 'x5t#S256'?: string

  public constructor(params?: KeyOptions) {
    if (params.use && typeof params.use !== 'string')
      throw new InvalidKey('Invalid parameter "use".')

    if (params.key_ops) {
      if (
        !Array.isArray(params.key_ops) ||
        params.key_ops.some(p => typeof p !== 'string')
      )
        throw new InvalidKey('Invalid parameter "key_ops".')

      if (new Set(params.key_ops).size !== params.key_ops.length)
        throw new InvalidKey(
          'Parameter "key_ops" cannot have repeated operations.'
        )
    }

    if (params.use && params.key_ops) {
      const sig = ['sign', 'verify']
      const enc = [
        'encrypt',
        'decrypt',
        'wrapKey',
        'unwrapKey',
        'deriveKey',
        'deriveBits'
      ]

      if (
        (params.use === 'sig' && params.key_ops.some(p => !sig.includes(p))) ||
        (params.use === 'enc' && params.key_ops.some(p => !enc.includes(p)))
      )
        throw new InvalidKey('Invalid combination of "use" and "key_ops".')
    }

    if (params.alg && typeof params.alg !== 'string')
      throw new InvalidKey('Invalid parameter "alg".')

    if (params.kid && typeof params.kid !== 'string')
      throw new InvalidKey('Invalid parameter "kid".')

    if (params.x5u) throw new InvalidKey('Unsupported parameter "x5u".')

    if (params.x5c) throw new InvalidKey('Unsupported parameter "x5c".')

    if (params.x5t) throw new InvalidKey('Unsupported parameter "x5t".')

    if (params['x5t#256'])
      throw new InvalidKey('Unsupported parameter "x5t#256".')

    Object.assign(
      this,
      Objects.removeNullishValues({
        use: params.use,
        key_ops: params.key_ops,
        alg: params.alg,
        kid: params.kid,
        x5u: params.x5u,
        x5c: params.x5c,
        x5t: params.x5t,
        'x5t#S256': params['x5t#S256']
      })
    )
  }
}

export interface SecretKey {
  secretKey: KeyObject
}

export interface PublicKey {
  publicKey: KeyObject
}

export interface PrivateKey {
  privateKey: KeyObject
}

export type SecretKeyLike = JsonWebKey & SecretKey
export type PublicKeyLike = JsonWebKey & PublicKey
export type PrivateKeyLike = JsonWebKey & PrivateKey
