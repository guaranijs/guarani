import { Buffer } from 'buffer';
import { createHash, timingSafeEqual } from 'crypto';

import { Injectable } from '@guarani/di';

import { Logger } from '../logger/logger';
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
   * Instantiates a new S256 PKCE Method
   *
   * @param logger Logger of the Authorization Server.
   */
  public constructor(private readonly logger: Logger) {}

  /**
   * Performs a comparison between the Authorization Code Challenge hash received at the Authorization Endpoint
   * and the ASCII Base64Url Encoded SHA-256 hash of the Authorization Code Verifier received at the Token Endpoint.
   *
   * @param challenge Authorization Code Challenge provided at the Authorization Endpoint.
   * @param verifier Authorization Code Verifier provided at the Token Endpoint.
   */
  public verify(challenge: string, verifier: string): boolean {
    this.logger.debug(`[${this.constructor.name}] Called verify()`, '593651af-dec1-4c7d-b25f-0c91d1fc2647', {
      challenge,
      verifier,
    });

    const challengeBuffer = Buffer.from(challenge, 'base64url');
    const verifierBuffer = createHash('sha256').update(verifier, 'ascii').digest();

    return challengeBuffer.length === verifierBuffer.length && timingSafeEqual(challengeBuffer, verifierBuffer);
  }
}
