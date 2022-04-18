import { Constructor, Optional } from '@guarani/types';

import { ClientAuthentication } from '../../client-authentication/client-authentication';
import { Endpoint } from '../../endpoints/endpoint';
import { GrantType } from '../../grant-types/grant-type';
import { PkceMethod } from '../../pkce/pkce-method';
import { ResponseMode } from '../../response-modes/response-mode';
import { ResponseType } from '../../response-types/response-type';
import { AccessTokenService } from '../../services/access-token.service';
import { AuthorizationCodeService } from '../../services/authorization-code.service';
import { ClientService } from '../../services/client.service';
import { RefreshTokenService } from '../../services/refresh-token.service';
import { UserService } from '../../services/user.service';

/**
 * Authorization Server Metadata Parameters.
 */
export interface AuthorizationServerMetadataParameters {
  /**
   * HTTPS URL without query or fragment components denoting the Issuer's Identifier.
   */
  readonly issuer: string;

  /**
   * Error Endpoint Path under the Issuer or custom full URL.
   */
  readonly errorUrl?: Optional<string>;

  /**
   * Scopes supported by the Authorization Server.
   */
  readonly scopes: string[];

  /**
   * Client Authentication Methods supported by the Authorization Server.
   */
  readonly clientAuthenticationMethods?: Optional<Constructor<ClientAuthentication>[]>;

  /**
   * Endpoints supported by the Authorization Server.
   */
  readonly endpoints?: Optional<Constructor<Endpoint>[]>;

  /**
   * Grant Types supported by the Authorization Server.
   */
  readonly grantTypes?: Optional<Constructor<GrantType>[]>;

  /**
   * Response Types supported by the Authorization Server.
   */
  readonly responseTypes?: Optional<Constructor<ResponseType>[]>;

  /**
   * Response Modes supported by the Authorization Server.
   */
  readonly responseModes?: Optional<Constructor<ResponseMode>[]>;

  /**
   * PKCE Methods supported by the Authorization Server.
   */
  readonly pkceMethods?: Optional<Constructor<PkceMethod>[]>;

  /**
   * Client Service.
   */
  readonly clientService: ClientService;

  /**
   * Access Token Service.
   */
  readonly accessTokenService: AccessTokenService;

  /**
   * User Service.
   */
  readonly userService?: Optional<UserService>;

  /**
   * Authorization Code Service.
   */
  readonly authorizationCodeService?: Optional<AuthorizationCodeService>;

  /**
   * Refresh Token Service.
   */
  readonly refreshTokenService?: Optional<RefreshTokenService>;
}
