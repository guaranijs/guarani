import { Injectable } from '@guarani/ioc';

import { createHash } from 'crypto';

import { Pkce } from './pkce';
import { SupportedPkce } from './types/supported-pkce';

/**
 * Implementation of the **S256 PKCE Method** as defined by
 * {@link https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2 Proof Key for Code Exchange by OAuth Public Clients}.
 */
@Injectable()
export class S256Pkce implements Pkce {
  /**
   * Name of the PKCE Method.
   */
  public readonly name: SupportedPkce = 'S256';

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
