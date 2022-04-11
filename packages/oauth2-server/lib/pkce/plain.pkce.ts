import { Injectable } from '@guarani/ioc';

import { Pkce } from './pkce';
import { SupportedPkce } from './types/supported-pkce';

/**
 * Implementation of the **Plain PKCE Method** as defined by
 * {@link https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2 Proof Key for Code Exchange by OAuth Public Clients}.
 */
@Injectable()
export class PlainPkce implements Pkce {
  /**
   * Name of the PKCE Method.
   */
  public readonly name: SupportedPkce = 'plain';

  /**
   * Performs a simple string comparison between the Code Challenge and the Code Verifier provided by the Client.
   *
   * @param codeChallenge Code Challenge provided at the Authorization Endpoint.
   * @param codeVerifier Code Verifier provided at the Token Endpoint.
   */
  public verify(codeChallenge: string, codeVerifier: string): boolean {
    return codeChallenge === codeVerifier;
  }
}