import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebKeySet,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { Display } from '../displays/display.type';
import { GrantType } from '../grant-types/grant-type.type';
import { Pkce } from '../pkces/pkce.type';
import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseType } from '../response-types/response-type.type';
import { SubjectType } from '../types/subject-type.type';
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
   * JSON Web Encryption Key Wrap Algorithms for ID Token Encryption registered at the Authorization Server.
   */
  readonly idTokenKeyWrapAlgorithms?: JsonWebEncryptionKeyWrapAlgorithm[];

  /**
   * JSON Web Encryption Content Encryption Algorithms for ID Token Encryption registered at the Authorization Server.
   */
  readonly idTokenContentEncryptionAlgorithms?: JsonWebEncryptionContentEncryptionAlgorithm[];

  /**
   * JSON Web Signature Algorithms for Userinfo JWT Response registered at the Authorization Server.
   */
  readonly userinfoSignatureAlgorithms?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * JSON Web Encryption Key Wrap Algorithms for Userinfo JWT Response registered at the Authorization Server.
   */
  readonly userinfoKeyWrapAlgorithms?: JsonWebEncryptionKeyWrapAlgorithm[];

  /**
   * JSON Web Encryption Content Encryption Algorithms for Userinfo JWT Response registered at the Authorization Server.
   */
  readonly userinfoContentEncryptionAlgorithms?: JsonWebEncryptionContentEncryptionAlgorithm[];

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
  readonly pkces: Pkce[];

  /**
   * Displays registered at the Authorization Server.
   */
  readonly displays: Display[];

  /**
   * Authentication Context Class References registered at the Authorization Server.
   */
  readonly acrValues: string[];

  /**
   * UI Locales registered at the Authorization Server.
   */
  readonly uiLocales: string[];

  /**
   * Subject Types registered at the Authorization Server.
   */
  readonly subjectTypes: SubjectType[];

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
   * Enables Refresh Token Revocation on the Authorization Server.
   *
   * @default true
   */
  readonly enableRefreshTokenRevocation: boolean;

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

  /**
   * Post Logout Url of the Authorization Server.
   */
  readonly postLogoutUrl?: string;

  /**
   * Secret Key of the Authorization Server.
   */
  readonly secretKey: string;

  /**
   * Maximum length of the Local User Identifier for Pairwise Subject Type.
   *
   * *note: this is only required when supporting **pairwise** subject type identifiers.*
   */
  readonly maxLocalSubjectLength?: number;
}
