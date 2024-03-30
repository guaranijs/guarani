import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';

import { Injectable } from '@guarani/di';

import { Logger } from '../logger/logger';
import { PkceInterface } from './pkce.interface';
import { Pkce } from './pkce.type';

/**
 * Implementation of the **Plain** PKCE.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2
 */
@Injectable()
export class PlainPkce implements PkceInterface {
  /**
   * Name of the PKCE.
   */
  public readonly name: Pkce = 'plain';

  /**
   * Instantiates a new Plain PKCE Method.
   *
   * @param logger Logger of the Plain PKCE Method.
   */
  public constructor(private readonly logger: Logger) {}

  /**
   * Performs a simple string comparison between the Authorization Code Challenge
   * and the Authorization Code Verifier provided by the Client.
   *
   * @param challenge Authorization Code Challenge provided at the Authorization Endpoint.
   * @param verifier Authorization Code Verifier provided at the Token Endpoint.
   */
  public verify(challenge: string, verifier: string): boolean {
    this.logger.debug(`[${this.constructor.name}] Called verify()`, '37c8c4b9-52a6-48c2-9733-583a14c8f34c', {
      challenge,
      verifier,
    });

    const challengeBuffer = Buffer.from(challenge, 'utf8');
    const verifierBuffer = Buffer.from(verifier, 'utf8');

    return challengeBuffer.length === verifierBuffer.length && timingSafeEqual(challengeBuffer, verifierBuffer);
  }
}
