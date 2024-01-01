import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebKeySetParameters,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';
import { Dictionary } from '@guarani/types';

import { ClientAuthentication } from '../../client-authentication/client-authentication.type';
import { GrantType } from '../../grant-types/grant-type.type';
import { ResponseType } from '../../response-types/response-type.type';
import { ApplicationType } from '../../types/application-type.type';
import { SubjectType } from '../../types/subject-type.type';

/**
 * Parameters of the OAuth 2.0 Put Client Registration Request Body Parameters.
 */
export interface PutBodyRegistrationRequest extends Dictionary<any> {
  /**
   * Unique Identifier of the Client.
   */
  readonly client_id: string;

  /**
   * Secret of the Client.
   */
  readonly client_secret?: string;

  /**
   * Redirect URIs of the Client.
   */
  readonly redirect_uris: string[];

  /**
   * Response Types of the Client.
   */
  readonly response_types?: ResponseType[];

  /**
   * Grant Types of the Client.
   */
  readonly grant_types?: (GrantType | 'implicit')[];

  /**
   * Application Type of the Client.
   */
  readonly application_type?: ApplicationType;

  /**
   * Name of the Client.
   */
  readonly client_name?: string;

  /**
   * Default scopes of the Client.
   */
  readonly scope: string;

  /**
   * Email addresses of the people responsible for the Client.
   */
  readonly contacts?: string[];

  /**
   * Url of the Logo of the Client.
   */
  readonly logo_uri?: string;

  /**
   * Url of the Home Page of the Client.
   */
  readonly client_uri?: string;

  /**
   * Url of the Policy Page of the Client.
   */
  readonly policy_uri?: string;

  /**
   * Url of the Terms of Service Page of the Client.
   */
  readonly tos_uri?: string;

  /**
   * Url of the JSON Web Key Set of the Client.
   */
  readonly jwks_uri?: string;

  /**
   * JSON Web Key Set of the Client.
   */
  readonly jwks?: JsonWebKeySetParameters;

  /**
   * Subject Type for responses to the Client.
   */
  readonly subject_type?: SubjectType;

  /**
   * Https Url used to calculate the Pseudonymous Identifiers of the Client.
   */
  readonly sector_identifier_uri?: string;

  /**
   * JSON Web Signature Algorithm used to sign the ID Token issued to the Client.
   */
  readonly id_token_signed_response_alg?: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the ID Token issued to the Client.
   */
  readonly id_token_encrypted_response_alg?: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the ID Token issued to the Client.
   */
  readonly id_token_encrypted_response_enc?: JsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Signature Algorithm used to sign the Userinfo JWT Response.
   */
  readonly userinfo_signed_response_alg?: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Userinfo JWT Response.
   */
  readonly userinfo_encrypted_response_alg?: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Userinfo JWT Response.
   */
  readonly userinfo_encrypted_response_enc?: JsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Signature Algorithm used to sign the Request Object sent to the Authorization Server.
   */
  // readonly request_object_signing_alg?: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // readonly request_object_encryption_alg?: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Request Object sent to the Authorization Server.
   */
  // readonly request_object_encryption_enc?: JsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * JSON Web Signature Algorithm used to sign the Authorization Response Token.
   */
  readonly authorization_signed_response_alg?: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * JSON Web Encryption Key Wrap Algorithm used to encrypt the Authorization Response Token.
   */
  readonly authorization_encrypted_response_alg?: JsonWebEncryptionKeyWrapAlgorithm;

  /**
   * JSON Web Encryption Content Encryption Algorithm used to encrypt the Authorization Response Token.
   */
  readonly authorization_encrypted_response_enc?: JsonWebEncryptionContentEncryptionAlgorithm;

  /**
   * Client Authentication Method of the Client.
   */
  readonly token_endpoint_auth_method?: ClientAuthentication;

  /**
   * JSON Web Signature Algorithm used by **client_secret_jwt** and/or **private_key_jwt**.
   */
  readonly token_endpoint_auth_signing_alg?: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  /**
   * Default Maximum Authentication Age.
   */
  readonly default_max_age?: number;

  /**
   * Indicates if the claim **auth_time** is required in the ID Token.
   */
  readonly require_auth_time?: boolean;

  /**
   * Default Authentication Context Class References of the Client.
   */
  readonly default_acr_values?: string[];

  /**
   * Url that a third party can use to initiate a login by the Client.
   */
  readonly initiate_login_uri?: string;

  /**
   * Pre-registered Request URIs of the Client.
   */
  // readonly request_uris?: string;

  /**
   * Post Logout Redirect URIs of the Client.
   */
  readonly post_logout_redirect_uris?: string[];

  /**
   * Back-Channel Logout URI of the Client.
   */
  readonly backchannel_logout_uri?: string;

  /**
   * Indicates if the **sid** claim must be provided at the Logout Token.
   */
  readonly backchannel_logout_session_required?: boolean;

  /**
   * Unique Identifier of the Software of the Client.
   */
  readonly software_id?: string;

  /**
   * Version of the Software of the Client.
   */
  readonly software_version?: string;
}
