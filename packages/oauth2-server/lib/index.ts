if (Reflect == null || !('getMetadata' in Reflect)) {
  throw new Error('@guarani/oauth2-server requires a Reflect Metadata polyfill.');
}

export { AuthorizationServer } from './authorization-server/authorization-server';

export { AccessToken } from './entities/access-token';
export { AuthorizationCode } from './entities/authorization-code';
export { Client } from './entities/client';
export { RefreshToken } from './entities/refresh-token';
export { User } from './entities/user';

export { HttpRequest } from './http/http.request';
export { HttpResponse } from './http/http.response';

export { ExpressProvider, expressProvider } from './integration/express';

export { AuthorizationServerMetadata } from './metadata/authorization-server-metadata';
export { AuthorizationServerMetadataOptions } from './metadata/authorization-server-metadata.options';
export { OAuth2Factory } from './metadata/oauth2.factory';

export { IAccessTokenService } from './services/access-token.service.interface';
export { IAuthorizationCodeService } from './services/authorization-code.service.interface';
export { IClientService } from './services/client.service.interface';
export { IRefreshTokenService } from './services/refresh-token.service.interface';
export { IUserService } from './services/user.service.interface';

export { ApplicationType } from './types/application-type';
export { ClientAuthentication } from './types/client-authentication';
export { ClientType } from './types/client-type';
export { ErrorCode } from './types/error-code';
export { GrantType } from './types/grant-type';
export { HttpMethod } from './types/http-method';
export { PkceMethod } from './types/pkce-method';
export { ResponseMode } from './types/response-mode';
export { ResponseType } from './types/response-type';
export { TokenType } from './types/token-type';
export { TokenTypeHint } from './types/token-type-hint';
