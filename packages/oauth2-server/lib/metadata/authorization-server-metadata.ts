import { AuthorizationServerOptions } from '../authorization-server/options/authorization-server.options';
import { AuthorizationServerMetadataOptions } from './authorization-server-metadata.options';
import { defineMetadata } from './helpers/define-metadata';
import {
  ACCESS_TOKEN_SERVICE,
  AUTHORIZATION_CODE_SERVICE,
  AUTHORIZATION_SERVER_OPTIONS,
  CLIENT_AUTHENTICATION,
  CLIENT_SERVICE,
  GRANT_TYPE,
  ORIGINAL_METADATA,
  PKCE_METHOD,
  REFRESH_TOKEN_SERVICE,
  RESPONSE_MODE,
  RESPONSE_TYPE,
  USER_SERVICE,
} from './injectable-tokens';

/**
 * Defines the Configuration options of the Authorization Server.
 *
 * @param options Configuration options of the Authorization Server.
 */
export function AuthorizationServerMetadata(options: AuthorizationServerMetadataOptions): ClassDecorator {
  return function (target: Function): void {
    defineMetadata(CLIENT_AUTHENTICATION, options.clientAuthenticationMethods, target);
    defineMetadata(GRANT_TYPE, options.grantTypes, target);
    defineMetadata(PKCE_METHOD, options.pkceMethods, target);
    defineMetadata(RESPONSE_MODE, options.responseModes, target);
    defineMetadata(RESPONSE_TYPE, options.responseTypes, target);

    defineMetadata<AuthorizationServerOptions>(
      AUTHORIZATION_SERVER_OPTIONS,
      {
        issuer: options.issuer,
        scopes: options.scopes,
        userInteraction: options.userInteraction,
        enableAccessTokenRevocation: options.enableAccessTokenRevocation ?? true,
        enableRefreshTokenIntrospection: options.enableRefreshTokenIntrospection ?? false,
        enableRefreshTokenRotation: options.enableRefreshTokenRotation ?? false,
      },
      target
    );

    defineMetadata(ACCESS_TOKEN_SERVICE, options.accessTokenService, target);
    defineMetadata(CLIENT_SERVICE, options.clientService, target);
    defineMetadata(AUTHORIZATION_CODE_SERVICE, options.authorizationCodeService, target);
    defineMetadata(REFRESH_TOKEN_SERVICE, options.refreshTokenService, target);
    defineMetadata(USER_SERVICE, options.userService, target);

    defineMetadata<AuthorizationServerMetadataOptions>(ORIGINAL_METADATA, options, target);
  };
}
