import { Constructor } from '@guarani/di';
import { JsonWebKeySetParameters, JsonWebSignatureAlgorithm } from '@guarani/jose';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { GrantType } from '../grant-types/grant-type.type';
import { PkceMethod } from '../pkce/pkce-method.type';
import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseType } from '../response-types/response-type.type';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { ClientServiceInterface } from '../services/client.service.interface';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { SessionServiceInterface } from '../services/session.service.interface';
import { UserServiceInterface } from '../services/user.service.interface';
import { UserInteractionSettings } from '../settings/user-interaction.settings';

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
   *
   * @default ['client_secret_basic']
   */
  readonly clientAuthenticationMethods?: ClientAuthentication[];

  /**
   * JSON Web Signature Algoithms for Client Authentication to be registered at the Authorization Server.
   */
  readonly clientAuthenticationSignatureAlgorithms?: JsonWebSignatureAlgorithm[];

  /**
   * Grant Types to be registered at the Authorization Server.
   *
   * @default ['authorization_code']
   */
  readonly grantTypes?: GrantType[];

  /**
   * Response Types to be registered at the Authorization Server.
   *
   * @default ['code']
   */
  readonly responseTypes?: ResponseType[];

  /**
   * Response Modes to be registered at the Authorization Server.
   *
   * @default ['query']
   */
  readonly responseModes?: ResponseMode[];

  /**
   * PKCE Methods to be registered at the Authorization Server.
   *
   * @default ['S256']
   */
  readonly pkceMethods?: PkceMethod[];

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
   * Enables Access Token Revocation on the Authorization Server.
   *
   * @default true
   */
  readonly enableAccessTokenRevocation?: boolean;

  /**
   * Enables Refresh Token Introspection on the Authorization Server.
   *
   * @default false
   */
  readonly enableRefreshTokenIntrospection?: boolean;

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
   * Access Token Service.
   */
  readonly accessTokenService?: AccessTokenServiceInterface | Constructor<AccessTokenServiceInterface>;

  /**
   * Authorization Code Service.
   */
  readonly authorizationCodeService?:
    | AuthorizationCodeServiceInterface
    | Constructor<AuthorizationCodeServiceInterface>;

  /**
   * Client Service.
   */
  readonly clientService?: ClientServiceInterface | Constructor<ClientServiceInterface>;

  /**
   * Consent Service.
   */
  readonly consentService?: ConsentServiceInterface | Constructor<ConsentServiceInterface>;

  /**
   * Device Code Service.
   */
  readonly deviceCodeService?: DeviceCodeServiceInterface | Constructor<DeviceCodeServiceInterface>;

  /**
   * Grant Service.
   */
  readonly grantService?: GrantServiceInterface | Constructor<GrantServiceInterface>;

  /**
   * Refresh Token Service.
   */
  readonly refreshTokenService?: RefreshTokenServiceInterface | Constructor<RefreshTokenServiceInterface>;

  /**
   * Session Service.
   */
  readonly sessionService?: SessionServiceInterface | Constructor<SessionServiceInterface>;

  /**
   * User Service.
   */
  readonly userService?: UserServiceInterface | Constructor<UserServiceInterface>;
}
