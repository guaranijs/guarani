import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebKeySetParameters,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';
import { Nullable } from '@guarani/types';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { GrantType } from '../grant-types/grant-type.type';
import { ResponseType } from '../response-types/response-type.type';
import { ApplicationType } from '../types/application-type.type';
import { SubjectType } from '../types/subject-type.type';

/**
 * OAuth 2.0 Client Entity.
 */
export interface Client {
  /**
   * Identifier of the Client.
   */
  readonly id: string;

  /**
   * Secret of the Client.
   */
  secret: Nullable<string>;

  /**
   * Expiration Date of the Client Secret.
   *
   * A **null** value indicates that the Client Secret will not expire.
   */
  secretExpiresAt: Nullable<Date>;

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
  authenticationSigningAlgorithm: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * Scopes of the Client.
   */
  scopes: string[];

  /**
   * URI of the Home Page of the Client.
   */
  clientUri: Nullable<string>;

  /**
   * URI of the Logo of the Client.
   */
  logoUri: Nullable<string>;

  /**
   * Array of email addresses of people responsible for the Client.
   */
  contacts: Nullable<string[]>;

  /**
   * URI of the Privacy Policy page of the Client.
   */
  policyUri: Nullable<string>;

  /**
   * URI of the Terms of Services page of the Client.
   */
  tosUri: Nullable<string>;

  /**
   * JSON Web Key Set URL of the Client.
   */
  jwksUri: Nullable<string>;

  /**
   * JSON Web Key Set object containing the JSON Web Keys of the Client.
   */
  jwks: Nullable<JsonWebKeySetParameters>;

  /**
   * Subject Type for responses to the Client.
   */
  subjectType: SubjectType;

  /**
   * Https Url used to calculate the Pseudonymous Identifiers of the Client.
   */
  sectorIdentifierUri: Nullable<string>;

  /**
   * Client Salt for the Pairwise Subject Type.
   */
  pairwiseSalt: Nullable<string>;

  /**
   * JSON Web Signature Algorithm used to sign the ID Token issued to the Client.
   */
  idTokenSignedResponseAlgorithm: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the ID Token issued to the Client.
   */
  idTokenEncryptedResponseKeyWrap: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the ID Token issued to the Client.
   */
  idTokenEncryptedResponseContentEncryption: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * JSON Web Signature Algorithm used to sign the Userinfo JWT Response.
   */
  userinfoSignedResponseAlgorithm: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Userinfo JWT Response.
   */
  userinfoEncryptedResponseKeyWrap: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Userinfo JWT Response.
   */
  userinfoEncryptedResponseContentEncryption: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * JSON Web Signature Algorithm used to sign the Request Object sent to the Authorization Server.
   */
  // requestObjectSigningAlgorithm: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // requestObjectEncryptionKeyWrap: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // requestObjectEncryptionContentEncryption: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * Default Maximum Authentication Age.
   */
  defaultMaxAge: Nullable<number>;

  /**
   * Indicates if the claim **auth_time** is required in the ID Token.
   */
  requireAuthTime: boolean;

  /**
   * Default Authentication Context Class References of the Client.
   */
  defaultAcrValues: Nullable<string[]>;

  /**
   * Url that a third party can use to initiate a login by the Client.
   */
  initiateLoginUri: Nullable<string>;

  /**
   * Pre-registered Request URIs of the Client.
   */
  // requestUris: Nullable<string[]>;

  /**
   * Post Logout Redirect URIs of the Client.
   */
  postLogoutRedirectUris: Nullable<string[]>;

  /**
   * Unique Identifier of the Software of the Client.
   */
  softwareId: Nullable<string>;

  /**
   * Version of the Software of the Client.
   */
  softwareVersion: Nullable<string>;

  /**
   * Creation Date of the Client.
   */
  readonly createdAt: Date;
}
