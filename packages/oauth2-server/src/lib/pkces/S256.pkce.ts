import { Injectable } from '@guarani/di';

import { Buffer } from 'buffer';
import { createHash, timingSafeEqual } from 'crypto';

import { PkceInterface } from './pkce.interface';
import { Pkce } from './pkce.type';

/**
 * Implementation of the **S256** PKCE.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2
 */
@Injectable()
export class S256Pkce implements PkceInterface {
  /**
   * Name of the PKCE.
   */
  public readonly name: Pkce = 'S256';

  /**
   * Performs a comparison between the Authorization Code Challenge hash received at the Authorization Endpoint
   * and the ASCII Base64Url Encoded SHA-256 hash of the Authorization Code Verifier received at the Token Endpoint.
   *
   * @param challenge Authorization Code Challenge provided at the Authorization Endpoint.
   * @param verifier Authorization Code Verifier provided at the Token Endpoint.
   */
  public verify(challenge: string, verifier: string): boolean {
    const challengeBuffer = Buffer.from(challenge, 'base64url');
    const verifierBuffer = createHash('sha256').update(verifier, 'ascii').digest();

    return challengeBuffer.length === verifierBuffer.length && timingSafeEqual(challengeBuffer, verifierBuffer);
  }
}
