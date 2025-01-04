import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebKeySetParameters,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';
import { Dictionary, Nullable } from '@guarani/types';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { GrantType } from '../grant-types/grant-type.type';
import { ResponseType } from '../response-types/response-type.type';
import { ApplicationType } from '../types/application-type.type';
import { SubjectType } from '../types/subject-type.type';

/**
 * OAuth 2.0 Client Entity.
 */
export abstract class Client implements Dictionary<unknown> {
  /**
   * Identifier of the Client.
   */
  public readonly id!: string;

  /**
   * Secret of the Client.
   */
  public secret!: Nullable<string>;

  /**
   * Expiration Date of the Client Secret.
   *
   * A **null** value indicates that the Client Secret will not expire.
   */
  public secretExpiresAt!: Nullable<Date>;

  /**
   * Name of the Client.
   */
  public name!: string;

  /**
   * Redirect URIs of the Client.
   */
  public redirectUris!: string[];

  /**
   * Response Types of the Client.
   */
  public responseTypes!: ResponseType[];

  /**
   * Grant Types of the Client.
   */
  public grantTypes!: (GrantType | 'implicit')[];

  /**
   * Application Type of the Client.
   */
  public applicationType!: ApplicationType;

  /**
   * Client Authentication Method of the Client.
   */
  public authenticationMethod!: ClientAuthentication;

  /**
   * JSON Web Signature Algorithm used to validate the JWT Bearer Client Assertion.
   */
  public authenticationSigningAlgorithm!: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * Scopes of the Client.
   */
  public scopes!: string[];

  /**
   * URI of the Home Page of the Client.
   */
  public clientUri!: Nullable<string>;

  /**
   * URI of the Logo of the Client.
   */
  public logoUri!: Nullable<string>;

  /**
   * Array of email addresses of people responsible for the Client.
   */
  public contacts!: Nullable<string[]>;

  /**
   * URI of the Privacy Policy page of the Client.
   */
  public policyUri!: Nullable<string>;

  /**
   * URI of the Terms of Services page of the Client.
   */
  public tosUri!: Nullable<string>;

  /**
   * JSON Web Key Set URL of the Client.
   */
  public jwksUri!: Nullable<string>;

  /**
   * JSON Web Key Set object containing the JSON Web Keys of the Client.
   */
  public jwks!: Nullable<JsonWebKeySetParameters>;

  /**
   * Subject Type for responses to the Client.
   */
  public subjectType!: SubjectType;

  /**
   * Https Url used to calculate the Pseudonymous Identifiers of the Client.
   */
  public sectorIdentifierUri!: Nullable<string>;

  /**
   * Client Salt for the Pairwise Subject Type.
   */
  public pairwiseSalt!: Nullable<string>;

  /**
   * JSON Web Signature Algorithm used to sign the ID Token issued to the Client.
   */
  public idTokenSignedResponseAlgorithm!: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the ID Token issued to the Client.
   */
  public idTokenEncryptedResponseKeyWrap!: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the ID Token issued to the Client.
   */
  public idTokenEncryptedResponseContentEncryption!: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * JSON Web Signature Algorithm used to sign the Userinfo JWT Response.
   */
  public userinfoSignedResponseAlgorithm!: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Userinfo JWT Response.
   */
  public userinfoEncryptedResponseKeyWrap!: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Userinfo JWT Response.
   */
  public userinfoEncryptedResponseContentEncryption!: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * JSON Web Signature Algorithm used to sign the Request Object sent to the Authorization Server.
   */
  // public requestObjectSigningAlgorithm!: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // public requestObjectEncryptionKeyWrap!: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // public requestObjectEncryptionContentEncryption!: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * JSON Web Signature Algorithm used to sign the Authorization Response Token.
   */
  public authorizationSignedResponseAlgorithm!: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Authorization Response Token.
   */
  public authorizationEncryptedResponseKeyWrap!: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Authorization Response Token.
   */
  public authorizationEncryptedResponseContentEncryption!: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * Default Maximum Authentication Age.
   */
  public defaultMaxAge!: Nullable<number>;

  /**
   * Indicates if the claim **auth_time** is required in the ID Token.
   */
  public requireAuthTime!: boolean;

  /**
   * Default Authentication Context Class References of the Client.
   */
  public defaultAcrValues!: Nullable<string[]>;

  /**
   * Url that a third party can use to initiate a login by the Client.
   */
  public initiateLoginUri!: Nullable<string>;

  /**
   * Pre-registered Request URIs of the Client.
   */
  // public requestUris!: Nullable<string[]>;

  /**
   * Post Logout Redirect URIs of the Client.
   */
  public postLogoutRedirectUris!: Nullable<string[]>;

  /**
   * Back-Channel Logout URI of the Client.
   */
  public backChannelLogoutUri!: Nullable<string>;

  /**
   * Indicates if the **sid** claim must be provided at the Logout Token.
   */
  public backChannelLogoutSessionRequired!: Nullable<boolean>;

  /**
   * Unique Identifier of the Software of the Client.
   */
  public softwareId!: Nullable<string>;

  /**
   * Version of the Software of the Client.
   */
  public softwareVersion!: Nullable<string>;

  /**
   * Creation Date of the Client.
   */
  public readonly createdAt!: Date;

  /**
   * Additional Client Parameters.
   */
  [parameter: string]: unknown;

  /**
   * Expiration status of the Client's Secret.
   */
  public get isSecretExpired(): boolean {
    return this.secretExpiresAt !== null && new Date() >= this.secretExpiresAt;
  }
}
