import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';
import { Dictionary } from '@guarani/types';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { Display } from '../displays/display.type';
import { GrantType } from '../grant-types/grant-type.type';
import { Pkce } from '../pkces/pkce.type';
import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseType } from '../response-types/response-type.type';
import { Prompt } from '../types/prompt.type';
import { SubjectType } from '../types/subject-type.type';

/**
 * Parameters of the OAuth 2.0 Discovery Endpoint.
 */
export interface DiscoveryResponse extends Dictionary<any> {
  /**
   * Url of the Issuer of the Authorization Server.
   */
  readonly issuer: string;

  /**
   * Url of the Authorization Endpoint.
   */
  readonly authorization_endpoint?: string;

  /**
   * Url of the Token Endpoint.
   */
  readonly token_endpoint?: string;

  /**
   * Url of the Userinfo Endpoint.
   */
  readonly userinfo_endpoint?: string;

  /**
   * Url of the JSON Web Key Set of the Authorization Server.
   */
  readonly jwks_uri?: string;

  /**
   * Url of the Dynamic Client Registration Endpoint.
   */
  readonly registration_endpoint?: string;

  /**
   * Scopes supported by the Authorization Server.
   */
  readonly scopes_supported: string[];

  /**
   * Response Types supported by the Authorization Server.
   */
  readonly response_types_supported?: ResponseType[];

  /**
   * Response Modes supported by the Authorization Server.
   */
  readonly response_modes_supported?: ResponseMode[];

  /**
   * Grant Types supported by the Authorization Server.
   */
  readonly grant_types_supported?: GrantType[];

  /**
   * Authentication Context Class References supported by the Authorization Server.
   */
  readonly acr_values_supported?: string[];

  /**
   * Subject Types supported by the Authorization Server.
   */
  readonly subject_types_supported: SubjectType[];

  /**
   * JSON Web Signature Algorithms for ID Token Signature supported by the Authorization Server.
   */
  readonly id_token_signing_alg_values_supported: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * JSON Web Encryption Key Wrap Algorithms for ID Token Encryption supported by the Authorization Server.
   */
  readonly id_token_encryption_alg_values_supported?: JsonWebEncryptionKeyWrapAlgorithm[];

  /**
   * JSON Web Encryption Content Encryption Algorithms for ID Token Encryption supported by the Authorization Server.
   */
  readonly id_token_encryption_enc_values_supported?: JsonWebEncryptionContentEncryptionAlgorithm[];

  /**
   * JSON Web Signature Algorithms for Userinfo JWT Response supported by the Authorization Server.
   */
  readonly userinfo_signing_alg_values_supported?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * JSON Web Encryption Key Wrap Algorithms for Userinfo JWT Response supported by the Authorization Server.
   */
  readonly userinfo_encryption_alg_values_supported?: JsonWebEncryptionKeyWrapAlgorithm[];

  /**
   * JSON Web Encryption Content Encryption Algorithms for Userinfo JWT Response supported by the Authorization Server.
   */
  readonly userinfo_encryption_enc_values_supported?: JsonWebEncryptionContentEncryptionAlgorithm[];

  /**
   * JSON Web Signature Algorithms for Request Object Authorization Request Parameter supported by the Authorization Server.
   */
  // readonly request_object_signing_alg_values_supported?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * JSON Web Encryption Key Wrap Algorithms for Request Object Authorization Request Parameter supported by the Authorization Server.
   */
  // readonly request_object_encryption_alg_values_supported?: JsonWebEncryptionKeyWrapAlgorithm[];

  /**
   * JSON Web Encryption Content Encryption Algorithms for Request Object Authorization Request Parameter supported by the Authorization Server.
   */
  // readonly request_object_encryption_enc_values_supported?: JsonWebEncryptionContentEncryptionAlgorithm[];

  /**
   * Client Authentication Methods supported by the Token Endpoint.
   */
  readonly token_endpoint_auth_methods_supported?: ClientAuthentication[];

  /**
   * JSON Web Signature Algorithms supported by the Client Assertion Method of the Token Endpoint.
   */
  readonly token_endpoint_auth_signing_alg_values_supported?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * Prompts supported by the Authorization Server.
   */
  readonly prompt_values_supported: Prompt[];

  /**
   * Display Methods supported by the Authorization Server.
   */
  readonly display_values_supported: Display[];

  /**
   * Claim Types supported by the Authorization Server.
   */
  // readonly claim_types_supported: ClaimType[];

  /**
   * Claims supported by the Authorization Server.
   */
  // readonly claims_supported: ClaimType[];

  /**
   * Url of the Human-Readable documentation of the Authorization Server.
   */
  readonly service_documentation?: string;

  /**
   * Claims Locales supported by the Authorization Server.
   */
  // readonly claims_locales_supported?: string[];

  /**
   * User Interface Locales supported by the Authorization Server.
   */
  readonly ui_locales_supported?: string[];

  /**
   * Informs whether or not the Authorization Server supports the usage of the Authorization Request Parameter **Claims**.
   */
  // readonly claims_parameter_supported?: boolean;

  /**
   * Informs whether or not the Authorization Server supports the usage of the Authorization Request Parameter **Request**.
   */
  // readonly request_parameter_supported?: boolean;

  /**
   * Informs whether or not the Authorization Server supports the usage of the Authorization Request Parameter **Request URI**.
   */
  // readonly request_uri_parameter_supported?: boolean;

  /**
   * Informs whether or not the Authorization Server requires the Client to pre-register **request_uri** values.
   */
  // readonly require_request_uri_registration?: boolean;

  /**
   * Url of the Privacy Policy of the Authorization Server.
   */
  readonly op_policy_uri?: string;

  /**
   * Url of the Terms of Service of the Authorization Server.
   */
  readonly op_tos_uri?: string;

  /**
   * Url of the Revocation Endpoint.
   */
  readonly revocation_endpoint?: string;

  /**
   * Client Authentication Methods supported by the Revocation Endpoint.
   */
  readonly revocation_endpoint_auth_methods_supported?: ClientAuthentication[];

  /**
   * JSON Web Signature Algorithms supported by the Client Assertion Method of the Revocation Endpoint.
   */
  readonly revocation_endpoint_auth_signing_alg_values_supported?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * Url of the Introspection Endpoint.
   */
  readonly introspection_endpoint?: string;

  /**
   * Client Authentication Methods supported by the Introspection Endpoint.
   */
  readonly introspection_endpoint_auth_methods_supported?: ClientAuthentication[];

  /**
   * JSON Web Signature Algorithms supported by the Client Assertion Method of the Introspection Endpoint.
   */
  readonly introspection_endpoint_auth_signing_alg_values_supported?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * PKCE Code Challenge Methods supported by the Authorization Server.
   */
  readonly code_challenge_methods_supported?: Pkce[];

  /**
   * Url of the Interaction Endpoint.
   */
  readonly interaction_endpoint?: string;

  /**
   * Url of the Device Authorization Endpoint.
   */
  readonly device_authorization_endpoint?: string;

  /**
   * Url of the Logout Endpoint.
   */
  readonly end_session_endpoint?: string;

  /**
   * Informs whether or not the Authorization Server supports Issuer Identifier on the Authorization Response.
   */
  readonly authorization_response_iss_parameter_supported: boolean;
}
