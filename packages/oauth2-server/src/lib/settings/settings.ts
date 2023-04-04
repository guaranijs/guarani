import { JsonWebKeySet, JsonWebSignatureAlgorithm } from '@guarani/jose';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { GrantType } from '../grant-types/grant-type.type';
import { PkceMethod } from '../pkce/pkce-method.type';
import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseType } from '../response-types/response-type.type';
import { UserInteractionSettings } from './user-interaction.settings';

/**
 * Settings used to customize the behaviour of the Authorization Server.
 */
export interface Settings {
  /**
   * Identifier of the Authorization Server's Issuer.
   */
  readonly issuer: string;

  /**
   * Scopes registered at the Authorization Server.
   */
  readonly scopes: string[];

  /**
   * Client Authentication Methods registered at the Authorization Server.
   */
  readonly clientAuthenticationMethods: ClientAuthentication[];

  /**
   * JSON Web Signature Algoithms for Client Authentication registered at the Authorization Server.
   */
  readonly clientAuthenticationSignatureAlgorithms: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * JSON Web Signature Algorithms for ID Token Signature registered at the Authorization Server.
   */
  readonly idTokenSignatureAlgorithms: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * Grant Types registered at the Authorization Server.
   */
  readonly grantTypes: GrantType[];

  /**
   * Response Types registered at the Authorization Server.
   */
  readonly responseTypes: ResponseType[];

  /**
   * Response Modes registered at the Authorization Server.
   */
  readonly responseModes: ResponseMode[];

  /**
   * PKCE Methods registered at the Authorization Server.
   */
  readonly pkceMethods: PkceMethod[];

  /**
   * JSON Web Key Set of the Authorization Server.
   */
  readonly jwks?: JsonWebKeySet;

  /**
   * Defines the Parameters of the User Interaction.
   */
  readonly userInteraction?: UserInteractionSettings;

  /**
   * Enables Refresh Token Rotation on the Authorization Server.
   *
   * @default false
   */
  readonly enableRefreshTokenRotation: boolean;

  /**
   * Enables Access Token Revocation on the Authorization Server.
   *
   * @default true
   */
  readonly enableAccessTokenRevocation: boolean;

  /**
   * Enables Refresh Token Introspection on the Authorization Server.
   *
   * @default false
   */
  readonly enableRefreshTokenIntrospection: boolean;

  /**
   * Polling interval of the Device Authorization Grant.
   */
  readonly devicePollingInterval: number;

  /**
   * Enables Authorization Response Issuer Identifier in Authorization and Token Responses.
   */
  readonly enableAuthorizationResponseIssuerIdentifier: boolean;
}
