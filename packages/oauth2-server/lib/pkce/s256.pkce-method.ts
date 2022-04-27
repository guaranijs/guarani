import { Injectable } from '@guarani/di';

import { createHash } from 'crypto';

import { PkceMethod } from '../types/pkce-method';
import { IPkceMethod } from './pkce-method.interface';

/**
 * Implementation of the **S256** PKCE Method.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2
 */
@Injectable()
export class S256PkceMethod implements IPkceMethod {
  /**
   * Name of the PKCE Method.
   */
  public readonly name: PkceMethod = 'S256';

  /**
   * Performs a comparison between the Authorization Code Challenge hash received at the Authorization Endpoint
   * and the ASCII Base64Url Encoded SHA-256 hash of the Authorization Code Verifier received at the Token Endpoint.
   *
   * @param challenge Authorization Code Challenge provided at the Authorization Endpoint.
   * @param verifier Authorization Code Verifier provided at the Token Endpoint.
   */
  public verify(challenge: string, verifier: string): boolean {
    return challenge === createHash('sha256').update(verifier, 'ascii').digest().toString('base64url');
  }
}
