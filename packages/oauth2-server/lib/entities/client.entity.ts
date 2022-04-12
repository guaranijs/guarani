import { Optional } from '@guarani/types';

import { URL } from 'url';

import { SupportedClientAuthentication } from '../client-authentication/types/supported-client-authentication';
import { SupportedGrantType } from '../grant-types/types/supported-grant-type';
import { SupportedResponseType } from '../response-types/types/supported-response-type';

/**
 * Representation of the OAuth 2.0 Client.
 */
export interface ClientEntity {
  /**
   * Identifier of the Client.
   */
  readonly id: string;

  /**
   * Secret of the Client.
   */
  secret?: Optional<string>;

  /**
   * Redirect URIs of the Client.
   */
  redirectUris: URL[];

  /**
   * Authentication Method of the Client.
   */
  authenticationMethod: SupportedClientAuthentication;

  /**
   * Grant Types allowed to the Client.
   */
  grantTypes: SupportedGrantType[];

  /**
   * Response Types allowed to the Client.
   */
  responseTypes: SupportedResponseType[];

  /**
   * Scopes allowed to the Client.
   */
  scopes: string[];

  /**
   * Optional additional parameters.
   */
  [parameter: string]: any;
}
