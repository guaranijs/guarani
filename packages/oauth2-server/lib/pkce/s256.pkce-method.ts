import { Injectable } from '@guarani/ioc';

import { createHash } from 'crypto';

import { PkceMethod } from './pkce-method';
import { SupportedPkceMethod } from './types/supported-pkce-method';

/**
 * Implementation of the **S256 PKCE Method**.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2
 */
@Injectable()
export class S256PkceMethod implements PkceMethod {
  /**
   * Name of the PKCE Method.
   */
  public readonly name: SupportedPkceMethod = 'S256';

  /**
   * Performs a comparison between the Code Challenge hash received at the Authorization Endpoint
   * and the ASCII Base64Url Encoded SHA-256 hash of the Code Verifier received at the Token Endpoint.
   *
   * @param codeChallenge Code Challenge provided at the Authorization Endpoint.
   * @param codeVerifier Code Verifier provided at the Token Endpoint.
   */
  public verify(codeChallenge: string, codeVerifier: string): boolean {
    return codeChallenge === createHash('sha256').update(codeVerifier, 'ascii').digest().toString('base64url');
  }
}
