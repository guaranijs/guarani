import { URL } from 'url';

import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebKeySet,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';
import { Nullable } from '@guarani/types';

import { ClientAuthentication } from '../../client-authentication/client-authentication.type';
import { AccessToken } from '../../entities/access-token.entity';
import { Client } from '../../entities/client.entity';
import { GrantType } from '../../grant-types/grant-type.type';
import { PutBodyRegistrationRequest } from '../../requests/registration/put-body.registration-request';
import { PutQueryRegistrationRequest } from '../../requests/registration/put-query.registration-request';
import { ResponseType } from '../../response-types/response-type.type';
import { ApplicationType } from '../../types/application-type.type';
import { SubjectType } from '../../types/subject-type.type';

/**
 * Parameters of the Put Client Registration Context.
 */
export interface PutRegistrationContext {
  /**
   * Parameters of the Put Registration Request Query.
   */
  readonly queryParameters: PutQueryRegistrationRequest;

  /**
   * Parameters of the Put Registration Request Body.
   */
  readonly bodyParameters: PutBodyRegistrationRequest;

  /**
   * Access Token of the Request.
   */
  readonly accessToken: AccessToken;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Identifier of the Client.
   */
  readonly clientId: string;

  /**
   * Secret of the Client.
   */
  readonly clientSecret: Nullable<string>;

  /**
   * Redirect URIs of the Client.
   */
  readonly redirectUris: URL[];

  /**
   * Response Types of the Client.
   */
  readonly responseTypes: ResponseType[];

  /**
   * Grant Types of the Client.
   */
  readonly grantTypes: (GrantType | 'implicit')[];

  /**
   * Application Type of the Client.
   */
  readonly applicationType: ApplicationType;

  /**
   * Name of the Client.
   */
  readonly clientName: Nullable<string>;

  /**
   * Default scopes of the Client.
   */
  readonly scopes: string[];

  /**
   * Email addresses of the people responsible for the Client.
   */
  readonly contacts: Nullable<string[]>;

  /**
   * Url of the Logo of the Client.
   */
  readonly logoUri: Nullable<URL>;

  /**
   * Url of the Home Page of the Client.
   */
  readonly clientUri: Nullable<URL>;

  /**
   * Url of the Policy Page of the Client.
   */
  readonly policyUri: Nullable<URL>;

  /**
   * Url of the Terms of Service Page of the Client.
   */
  readonly tosUri: Nullable<URL>;

  /**
   * Url of the JSON Web Key Set of the Client.
   */
  readonly jwksUri: Nullable<URL>;

  /**
   * JSON Web Key Set of the Client.
   */
  readonly jwks: Nullable<JsonWebKeySet>;

  /**
   * Subject Type for responses to the Client.
   */
  readonly subjectType: SubjectType;

  /**
   * Https Url used to calculate the Pseudonymous Identifiers of the Client.
   */
  readonly sectorIdentifierUri: Nullable<URL>;

  /**
   * JSON Web Signature Algorithm used to sign the ID Token issued to the Client.
   */
  readonly idTokenSignedResponseAlgorithm: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the ID Token issued to the Client.
   */
  readonly idTokenEncryptedResponseKeyWrap: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the ID Token issued to the Client.
   */
  readonly idTokenEncryptedResponseContentEncryption: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * JSON Web Signature Algorithm used to sign the Userinfo JWT Response.
   */
  readonly userinfoSignedResponseAlgorithm: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Userinfo JWT Response.
   */
  readonly userinfoEncryptedResponseKeyWrap: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Userinfo JWT Response.
   */
  readonly userinfoEncryptedResponseContentEncryption: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * JSON Web Signature Algorithm used to sign the Request Object sent to the Authorization Server.
   */
  // readonly requestObjectSigningAlgorithm: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // readonly requestObjectEncryptionKeyWrap: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // readonly requestObjectEncryptionContentEncryption: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  /**
   * Client Authentication Method of the Client.
   */
  readonly authenticationMethod: ClientAuthentication;

  /**
   * JSON Web Signature Algorithm used by **client_secret_jwt** and/or **private_key_jwt**.
   */
  readonly authenticationSigningAlgorithm: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  /**
   * Default Maximum Authentication Age.
   */
  readonly defaultMaxAge: Nullable<number>;

  /**
   * Indicates if the claim **auth_time** is required in the ID Token.
   */
  readonly requireAuthTime: boolean;

  /**
   * Default Authentication Context Class References of the Client.
   */
  readonly defaultAcrValues: Nullable<string[]>;

  /**
   * Url that a third party can use to initiate a login by the Client.
   */
  readonly initiateLoginUri: Nullable<URL>;

  /**
   * Pre-registered Request URIs of the Client.
   */
  // readonly requestUris: Nullable<URL[]>;

  /**
   * Post Logout Redirect URIs of the Client.
   */
  readonly postLogoutRedirectUris: Nullable<URL[]>;

  /**
   * Unique Identifier of the Software of the Client.
   */
  readonly softwareId: Nullable<string>;

  /**
   * Version of the Software of the Client.
   */
  readonly softwareVersion: Nullable<string>;
}
