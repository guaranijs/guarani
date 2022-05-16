import { JsonWebKeySet } from '@guarani/jose';
import { Dict, Optional } from '@guarani/types';

import { ApplicationType } from '../types/application-type';
import { ClientAuthentication } from '../types/client-authentication';
import { ClientType } from '../types/client-type';
import { GrantType } from '../types/grant-type';
import { ResponseType } from '../types/response-type';

/**
 * OAuth 2.0 Client Entity.
 */
export interface Client extends Dict {
  /**
   * Identifier of the Client.
   */
  id: string;

  /**
   * Secret of the Client.
   */
  secret?: Optional<string>;

  /**
   * Expiration Date of the Client Secret.
   *
   * An **undefined** value indicates that the Client Secret will not expire.
   */
  secretExpiresAt?: Optional<Date>;

  /**
   * Name of the Client.
   */
  name: string;

  /**
   * Redirect URIs of the Client.
   */
  redirectUris: string[];

  /**
   * Response Types of the Client.
   */
  responseTypes: ResponseType[];

  /**
   * Grant Types of the Client.
   */
  grantTypes: GrantType[];

  /**
   * Application Type of the Client.
   */
  applicationType: ApplicationType;

  /**
   * Client Authentication Method of the Client.
   */
  authenticationMethod: ClientAuthentication;

  /**
   * Scopes of the Client.
   */
  scopes: string[];

  /**
   * Type of the Client.
   */
  clientType: ClientType;

  /**
   * Lifetime of the Access Tokens issued to the Client in seconds.
   */
  accessTokenLifetime: number;

  /**
   * Lifetime of the Refresh Tokens issued to the Client in seconds.
   */
  refreshTokenLifetime?: Optional<number>;

  /**
   * URI of the Home Page of the Client.
   */
  clientUri?: Optional<string>;

  /**
   * URI of the Logo of the Client.
   */
  logoUri?: Optional<string>;

  /**
   * Array of email addresses of people responsible for the Client.
   */
  contacts?: Optional<string[]>;

  /**
   * URI of the Privacy Policy page of the Client.
   */
  policyUri?: Optional<string>;

  /**
   * URI of the Terms of Services page of the Client.
   */
  tosUri?: Optional<string>;

  /**
   * JSON Web Key Set URL of the Client.
   */
  jwksUri?: Optional<string>;

  /**
   * JSON Web Key Set object containing the JSON Web Keys of the Client.
   */
  jwks?: Optional<JsonWebKeySet>;

  /**
   * Unique Identifier of the Software of the Client.
   */
  softwareId?: Optional<string>;

  /**
   * Version of the Software of the Client.
   */
  softwareVersion?: Optional<string>;

  /**
   * Creation Date of the Client.
   */
  createdAt: Date;
}
