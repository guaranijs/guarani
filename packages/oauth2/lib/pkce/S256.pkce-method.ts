import { Injectable } from '@guarani/ioc'
import { base64UrlEncode } from '@guarani/utils'

import { createHash } from 'crypto'

import { SupportedPkceMethod } from '../constants'
import { PkceMethod } from './pkce-method'

@Injectable()
export class S256PkceMethod implements PkceMethod {
  public readonly name: SupportedPkceMethod = 'S256'

  public compare(challenge: string, verifier: string): boolean {
    const hashed = createHash('sha256').update(verifier, 'ascii').digest()
    return challenge === base64UrlEncode(hashed)
  }
}
