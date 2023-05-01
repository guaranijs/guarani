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
   * Creation Date of the Client Secret.
   *
   * A **nullish** value indicates that no Client Secret was issued.
   */
  secretIssuedAt?: Date | null;

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
  grantTypes: (GrantType | 'implicit')[];

  /**
   * Application Type of the Client.
   */
  applicationType: ApplicationType;

  /**
   * Client Authentication Method of the Client.
   */
  authenticationMethod: ClientAuthentication;

  /**
   * JSON Web Signature Algorithm used to validate the JWT Bearer Client Assertion.
   */
  authenticationSigningAlgorithm?: Exclude<JsonWebSignatureAlgorithm, 'none'> | null;

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
   * Https Url used to calculate the Pseudonymous Identifiers of the Client.
   */
  // sectorIdentifierUri?: string | null;

  /**
   * Subject Type for responses to the Client.
   */
  // subjectType: string;

  /**
   * JSON Web Signature Algorithm used to sign the ID Token issued to the Client.
   */
  idTokenSignedResponseAlgorithm?: Exclude<JsonWebSignatureAlgorithm, 'none'> | null;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the ID Token issued to the Client.
   */
  // idTokenEncryptedResponseKeyWrap?: JsonWebEncryptionKeyWrapAlgorithm | null;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the ID Token issued to the Client.
   */
  // idTokenEncryptedResponseContentEncryption?: JsonWebEncryptionContentEncryptionAlgorithm | null;

  /**
   * JSON Web Signature Algorithm used to sign the Userinfo JWT Response.
   */
  // userinfoSignedResponseAlgorithm?: Exclude<JsonWebSignatureAlgorithm, 'none'> | null;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Userinfo JWT Response.
   */
  // userinfoEncryptedResponseKeyWrap?: JsonWebEncryptionKeyWrapAlgorithm | null;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Userinfo JWT Response.
   */
  // userinfoEncryptedResponseContentEncryption?: JsonWebEncryptionContentEncryptionAlgorithm | null;

  /**
   * JSON Web Signature Algorithm used to sign the Request Object sent to the Authorization Server.
   */
  // requestObjectSigningAlgorithm?: Exclude<JsonWebSignatureAlgorithm, 'none'> | null;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // requestObjectEncryptionKeyWrap?: JsonWebEncryptionKeyWrapAlgorithm | null;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // requestObjectEncryptionContentEncryption?: JsonWebEncryptionContentEncryptionAlgorithm | null;

  /**
   * Default Maximum Authentication Age.
   */
  defaultMaxAge?: number | null;

  /**
   * Indicates if the claim **auth_time** is required in the ID Token.
   */
  requireAuthTime: boolean;

  /**
   * Default Authentication Context Class References of the Client.
   */
  defaultAcrValues?: string[] | null;

  /**
   * Url that a third party can use to initiate a login by the Client.
   */
  initiateLoginUri?: string | null;

  /**
   * Pre-registered Request URIs of the Client.
   */
  // requestUris?: string[] | null;

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
