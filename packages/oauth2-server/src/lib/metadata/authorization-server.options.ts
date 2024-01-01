import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebKeySetParameters,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';
import { ConstructorOrInstance } from '@guarani/types';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { GrantType } from '../grant-types/grant-type.type';
import { Pkce } from '../pkces/pkce.type';
import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseType } from '../response-types/response-type.type';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { ClientServiceInterface } from '../services/client.service.interface';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LogoutTicketServiceInterface } from '../services/logout-ticket.service.interface';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { SessionServiceInterface } from '../services/session.service.interface';
import { UserServiceInterface } from '../services/user.service.interface';
import { UserInteractionSettings } from '../settings/user-interaction.settings';
import { SubjectType } from '../types/subject-type.type';

/**
 * Configuration Parameters of the Authorization Server.
 */
export interface AuthorizationServerOptions {
  /**
   * Identifier of the Authorization Server's Issuer.
   */
  readonly issuer: string;

  /**
   * Scopes to be registered at the Authorization Server.
   */
  readonly scopes: string[];

  /**
   * Client Authentication Methods to be registered at the Authorization Server.
   */
  readonly clientAuthenticationMethods?: ClientAuthentication[];

  /**
   * JSON Web Signature Algoithms for Client Authentication to be registered at the Authorization Server.
   */
  readonly clientAuthenticationSignatureAlgorithms?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * JSON Web Signature Algorithms for ID Token Signature to be registered at the Authorization Server.
   */
  readonly idTokenSignatureAlgorithms?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * JSON Web Encryption Key Wrap Algorithms for ID Token Encryption to be registered at the Authorization Server.
   */
  readonly idTokenKeyWrapAlgorithms?: JsonWebEncryptionKeyWrapAlgorithm[];

  /**
   * JSON Web Encryption Content Encryption Algorithms for ID Token Encryption to be registered at the Authorization Server.
   */
  readonly idTokenContentEncryptionAlgorithms?: JsonWebEncryptionContentEncryptionAlgorithm[];

  /**
   * JSON Web Signature Algorithms for Userinfo JWT Response to be registered at the Authorization Server.
   */
  readonly userinfoSignatureAlgorithms?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * JSON Web Encryption Key Wrap Algorithms for Userinfo JWT Response to be registered at the Authorization Server.
   */
  readonly userinfoKeyWrapAlgorithms?: JsonWebEncryptionKeyWrapAlgorithm[];

  /**
   * JSON Web Encryption Content Encryption Algorithms for Userinfo JWT Response to be registered at the Authorization Server.
   */
  readonly userinfoContentEncryptionAlgorithms?: JsonWebEncryptionContentEncryptionAlgorithm[];

  /**
   * JSON Web Signature Algorithms for Authorization Response Token to be registered at the Authorization Server.
   */
  readonly authorizationSignatureAlgorithms?: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * JSON Web Encryption Key Wrap Algorithms for Authorization Response Token to be registered at the Authorization Server.
   */
  readonly authorizationKeyWrapAlgorithms?: JsonWebEncryptionKeyWrapAlgorithm[];

  /**
   * JSON Web Encryption Content Encryption Algorithms for Authorization Response Token to be registered at the Authorization Server.
   */
  readonly authorizationContentEncryptionAlgorithms?: JsonWebEncryptionContentEncryptionAlgorithm[];

  /**
   * Grant Types to be registered at the Authorization Server.
   */
  readonly grantTypes?: GrantType[];

  /**
   * Response Types to be registered at the Authorization Server.
   */
  readonly responseTypes?: ResponseType[];

  /**
   * Response Modes to be registered at the Authorization Server.
   */
  readonly responseModes?: ResponseMode[];

  /**
   * PKCE Methods to be registered at the Authorization Server.
   */
  readonly pkces?: Pkce[];

  /**
   * Authentication Context Class References registered at the Authorization Server.
   */
  readonly acrValues?: string[];

  /**
   * UI Locales registered at the Authorization Server.
   */
  readonly uiLocales?: string[];

  /**
   * Subject Types registered at the Authorization Server.
   *
   * @default ["public"]
   */
  readonly subjectTypes?: SubjectType[];

  /**
   * JSON Web Key Set of the Authorization Server.
   */
  readonly jwks?: JsonWebKeySetParameters;

  /**
   * Defines the Parameters of the User Interaction.
   */
  readonly userInteraction?: UserInteractionSettings;

  /**
   * Enables Refresh Token Rotation on the Authorization Server.
   *
   * @default false
   */
  readonly enableRefreshTokenRotation?: boolean;

  /**
   * Enables the Dynamic Client Registration Endpoint on the Authorization Server.
   *
   * @default false
   */
  readonly enableRegistrationEndpoint?: boolean;

  /**
   * Enables the Revocation Endpoint on the Authorization Server.
   *
   * @default true
   */
  readonly enableRevocationEndpoint?: boolean;

  /**
   * Enables the Introspection Endpoint on the Authorization Server.
   *
   * @default true
   */
  readonly enableIntrospectionEndpoint?: boolean;

  /**
   * Enables Refresh Token Revocation on the Authorization Server.
   *
   * @default true
   */
  readonly enableRefreshTokenRevocation?: boolean;

  /**
   * Enables Refresh Token Introspection on the Authorization Server.
   *
   * @default false
   */
  readonly enableRefreshTokenIntrospection?: boolean;

  /**
   * Indicates if the Authorization Server supports Back-Channel Logout.
   *
   * @default false
   */
  readonly enableBackChannelLogout?: boolean;

  /**
   * Indicates if the Authorization Server passes a **sid** claim in the Logout Token.
   *
   * @default false
   */
  readonly includeSessionIdInLogoutToken?: boolean;

  /**
   * Polling interval of the Device Authorization Grant.
   */
  readonly devicePollingInterval?: number;

  /**
   * Enables Authorization Response Issuer Identifier in Authorization and Token Responses.
   *
   * @default false
   */
  readonly enableAuthorizationResponseIssuerIdentifier?: boolean;

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

  /**
   * Access Token Service.
   */
  readonly accessTokenService?: ConstructorOrInstance<AccessTokenServiceInterface>;

  /**
   * Authorization Code Service.
   */
  readonly authorizationCodeService?: ConstructorOrInstance<AuthorizationCodeServiceInterface>;

  /**
   * Client Service.
   */
  readonly clientService?: ConstructorOrInstance<ClientServiceInterface>;

  /**
   * Consent Service.
   */
  readonly consentService?: ConstructorOrInstance<ConsentServiceInterface>;

  /**
   * Device Code Service.
   */
  readonly deviceCodeService?: ConstructorOrInstance<DeviceCodeServiceInterface>;

  /**
   * Session Service.
   */
  readonly sessionService?: ConstructorOrInstance<SessionServiceInterface>;

  /**
   * Grant Service.
   */
  readonly grantService?: ConstructorOrInstance<GrantServiceInterface>;

  /**
   * Login Service.
   */
  readonly loginService?: ConstructorOrInstance<LoginServiceInterface>;

  /**
   * Logout Service.
   */
  readonly logoutTicketService?: ConstructorOrInstance<LogoutTicketServiceInterface>;

  /**
   * Refresh Token Service.
   */
  readonly refreshTokenService?: ConstructorOrInstance<RefreshTokenServiceInterface>;

  /**
   * User Service.
   */
  readonly userService?: ConstructorOrInstance<UserServiceInterface>;
}
