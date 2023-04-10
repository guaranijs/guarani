import { JsonWebSignatureAlgorithm } from '@guarani/jose';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { Display } from '../displays/display.type';
import { GrantType } from '../grant-types/grant-type.type';
import { Pkce } from '../pkces/pkce.type';
import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseType } from '../response-types/response-type.type';

/**
 * Parameters of the OAuth 2.0 Discovery Endpoint.
 */
export interface DiscoveryResponse extends Record<string, any> {
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
   * JSON Web Signature Algorithms for ID Token Signature registered at the Authorization Server.
   */
  readonly id_token_signing_alg_values_supported: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * Display Methods supported by the Authorization Server.
   */
  readonly display_values_supported: Display[];

  /**
   * Client Authentication Methods supported by the Token Endpoint.
   */
  readonly token_endpoint_auth_methods_supported?: ClientAuthentication[];

  /**
   * JSON Web Signature Algorithms supported by the Client Assertion Method of the Token Endpoint.
   */
  readonly token_endpoint_auth_signing_alg_values_supported?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * Url of the Human-Readable documentation of the Authorization Server.
   */
  readonly service_documentation?: string;

  /**
   * User Interface Locales supported by the Authorization Server.
   */
  readonly ui_locales_supported?: string[];

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
   * Informs whether or not the Authorization Server supports Issuer Identifier on the Authorization Response.
   */
  readonly authorization_response_iss_parameter_supported: boolean;
}
