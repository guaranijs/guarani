import { Injectable } from '@guarani/ioc'
import { base64UrlEncode } from '@guarani/utils'

import { createHash } from 'crypto'

import { PkceMethod } from './pkce-method'

/**
 * PKCE S256 Method.
 */
@Injectable()
export class S256PkceMethod implements PkceMethod {
  /**
   * Name of the PKCE Method.
   */
  public readonly name: string = 'S256'

  /**
   * Performs a comparison between the Code Challenge hash received at the
   * Authorization Endpoint and the ASCII Base64 Url Encoded SHA-256
   * hash of the Code Verifier received at the Token Endpoint.
   *
   * @param challenge Code Challenge provided at the Authorization Endpoint.
   * @param verifier Code Verifier provided at the Token Endpoint.
   */
  public compare(challenge: string, verifier: string): boolean {
    const hashed = createHash('sha256').update(verifier, 'ascii').digest()
    return challenge === base64UrlEncode(hashed)
  }
}
