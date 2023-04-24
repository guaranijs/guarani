import { JsonWebKeySet, JsonWebSignatureAlgorithm } from '@guarani/jose';

import { URL } from 'url';

import { ClientAuthentication } from '../../client-authentication/client-authentication.type';
import { GrantType } from '../../grant-types/grant-type.type';
import { PostRegistrationRequest } from '../../requests/registration/post.registration-request';
import { ResponseType } from '../../response-types/response-type.type';
import { ApplicationType } from '../../types/application-type.type';

/**
 * Parameters of the Post Client Registration Context.
 */
export interface PostRegistrationContext {
  /**
   * Parameters of the Post Registration Request.
   */
  readonly parameters: PostRegistrationRequest;

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
  readonly clientName?: string;

  /**
   * Default scopes of the Client.
   */
  readonly scopes: string[];

  /**
   * Email addresses of the people responsible for the Client.
   */
  readonly contacts?: string[];

  /**
   * Url of the Logo of the Client.
   */
  readonly logoUri?: URL;

  /**
   * Url of the Home Page of the Client.
   */
  readonly clientUri?: URL;

  /**
   * Url of the Policy Page of the Client.
   */
  readonly policyUri?: URL;

  /**
   * Url of the Terms of Service Page of the Client.
   */
  readonly tosUri?: URL;

  /**
   * Url of the JSON Web Key Set of the Client.
   */
  readonly jwksUri?: URL;

  /**
   * JSON Web Key Set of the Client.
   */
  readonly jwks?: JsonWebKeySet;

  /**
   * Https Url used to calculate the Pseudonymous Identifiers of the Client.
   */
  // readonly sectorIdentifierUri?: string;

  /**
   * Subject Type for responses to the Client.
   */
  // readonly subjectType?: string;

  /**
   * JSON Web Signature Algorithm used to sign the ID Token issued to the Client.
   */
  readonly idTokenSignedResponseAlgorithm?: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the ID Token issued to the Client.
   */
  // readonly idTokenEncryptedResponseKeyWrap?: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the ID Token issued to the Client.
   */
  // readonly idTokenEncryptedResponseContentEncryption?: JsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Signature Algorithm used to sign the Userinfo JWT Response.
   */
  // readonly userinfoSignedResponseAlgorithm?: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Userinfo JWT Response.
   */
  // readonly userinfoEncryptedResponseKeyWrap?: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Userinfo JWT Response.
   */
  // readonly userinfoEncryptedResponseContentEncryption?: JsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Signature Algorithm used to sign the Request Object sent to the Authorization Server.
   */
  // readonly requestObjectSigningAlgorithm?: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // readonly requestObjectEncryptionKeyWrap?: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // readonly requestObjectEncryptionContentEncryption?: JsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * Client Authentication Method of the Client.
   */
  readonly authenticationMethod: ClientAuthentication;

  /**
   * JSON Web Signature Algorithm used by **client_secret_jwt** and/or **private_key_jwt**.
   */
  readonly authenticationSigningAlgorithm?: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * Default Maximum Authentication Age.
   */
  readonly defaultMaxAge?: number;

  /**
   * Indicates if the claim **auth_time** is required in the ID Token.
   */
  readonly requireAuthTime: boolean;

  /**
   * Default Authentication Context Class References of the Client.
   */
  readonly defaultAcrValues?: string[];

  /**
   * Url that a third party can use to initiate a login by the Client.
   */
  readonly initiateLoginUri?: URL;

  /**
   * Pre-registered Request URIs of the Client.
   */
  // readonly requestUris?: URL[];

  /**
   * Unique Identifier of the Software of the Client.
   */
  readonly softwareId?: string;

  /**
   * Version of the Software of the Client.
   */
  readonly softwareVersion?: string;
}
