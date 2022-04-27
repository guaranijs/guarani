import { ConstructorOrInstance, Optional } from '@guarani/types';

import { UserInteractionOptions } from '../authorization-server/options/user-interaction.options';
import { IAccessTokenService } from '../services/access-token.service.interface';
import { IAuthorizationCodeService } from '../services/authorization-code.service.interface';
import { IClientService } from '../services/client.service.interface';
import { IRefreshTokenService } from '../services/refresh-token.service.interface';
import { IUserService } from '../services/user.service.interface';
import { ClientAuthentication } from '../types/client-authentication';
import { GrantType } from '../types/grant-type';
import { PkceMethod } from '../types/pkce-method';
import { ResponseMode } from '../types/response-mode';
import { ResponseType } from '../types/response-type';

/**
 * Configuration Parameters of the Authorization Server Metadata Decorator.
 */
export interface AuthorizationServerMetadataOptions {
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
   *
   * @default ['client_secret_basic']
   */
  readonly clientAuthenticationMethods?: Optional<ClientAuthentication[]>;

  /**
   * Grant Types registered at the Authorization Server.
   *
   * @default ['authorization_code']
   */
  readonly grantTypes?: Optional<GrantType[]>;

  /**
   * Response Types registered at the Authorization Server.
   *
   * @default ['code']
   */
  readonly responseTypes?: Optional<ResponseType[]>;

  /**
   * Response Modes registered at the Authorization Server.
   *
   * @default ['query']
   */
  readonly responseModes?: Optional<ResponseMode[]>;

  /**
   * PKCE Methods registered at the Authorization Server.
   *
   * @default ['S256']
   */
  readonly pkceMethods?: Optional<PkceMethod[]>;

  /**
   * Defines the Parameters of the User Interaction.
   */
  readonly userInteraction?: Optional<UserInteractionOptions>;

  /**
   * Enables Refresh Token Rotation on the Authorization Server.
   *
   * @default false
   */
  readonly enableRefreshTokenRotation?: Optional<boolean>;

  /**
   * Enables the Revocation Endpoint on the Authorization Server.
   *
   * @default true
   */
  readonly enableRevocationEndpoint?: Optional<boolean>;

  /**
   * Enables the Introspection Endpoint on the Authorization Server.
   *
   * @default true
   */
  readonly enableIntrospectionEndpoint?: Optional<boolean>;

  /**
   * Enables Access Token Revocation on the Authorization Server.
   *
   * @default true
   */
  readonly enableAccessTokenRevocation?: Optional<boolean>;

  /**
   * Enables Refresh Token Introspection on the Authorization Server.
   *
   * @default false
   */
  readonly enableRefreshTokenIntrospection?: Optional<boolean>;

  /**
   * Access Token Service.
   */
  readonly accessTokenService: ConstructorOrInstance<IAccessTokenService>;

  /**
   * Authorization Code Service.
   */
  readonly authorizationCodeService?: Optional<ConstructorOrInstance<IAuthorizationCodeService>>;

  /**
   * Client Service.
   */
  readonly clientService: ConstructorOrInstance<IClientService>;

  /**
   * Refresh Token Service.
   */
  readonly refreshTokenService?: Optional<ConstructorOrInstance<IRefreshTokenService>>;

  /**
   * User Service.
   */
  readonly userService?: Optional<ConstructorOrInstance<IUserService>>;
}
