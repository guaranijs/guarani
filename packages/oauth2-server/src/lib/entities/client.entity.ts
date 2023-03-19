import { JsonWebKeySetParameters, JsonWebSignatureAlgorithm } from '@guarani/jose';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { GrantType } from '../grant-types/grant-type.type';
import { ResponseType } from '../response-types/response-type.type';
import { ApplicationType } from '../types/application-type.type';

/**
 * OAuth 2.0 Client Entity.
 */
export interface Client extends Record<string, any> {
  /**
   * Identifier of the Client.
   */
  readonly id: string;

  /**
   * Secret of the Client.
   */
  secret?: string | null;

  /**
   * Expiration Date of the Client Secret.
   *
   * A **nullish** value indicates that the Client Secret will not expire.
   */
  secretExpiresAt?: Date | null;

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
   * JSON Web Signature Algorithms used to validate the JWT Bearer Client Assertion.
   */
  authenticationSigningAlgorithms?: JsonWebSignatureAlgorithm[];

  /**
   * Scopes of the Client.
   */
  scopes: string[];

  /**
   * URI of the Home Page of the Client.
   */
  clientUri?: string | null;

  /**
   * URI of the Logo of the Client.
   */
  logoUri?: string | null;

  /**
   * Array of email addresses of people responsible for the Client.
   */
  contacts?: string[] | null;

  /**
   * URI of the Privacy Policy page of the Client.
   */
  policyUri?: string | null;

  /**
   * URI of the Terms of Services page of the Client.
   */
  tosUri?: string | null;

  /**
   * JSON Web Key Set URL of the Client.
   */
  jwksUri?: string | null;

  /**
   * JSON Web Key Set object containing the JSON Web Keys of the Client.
   */
  jwks?: JsonWebKeySetParameters | null;

  /**
   * Unique Identifier of the Software of the Client.
   */
  softwareId?: string | null;

  /**
   * Version of the Software of the Client.
   */
  softwareVersion?: string | null;

  /**
   * Creation Date of the Client.
   */
  readonly createdAt: Date;
}
