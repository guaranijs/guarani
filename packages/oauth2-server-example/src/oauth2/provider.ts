import {
  AuthorizationCodeGrantType,
  AuthorizationServer,
  AuthorizationServerMetadata,
  ClientSecretBasicClientAuthentication,
  CodeResponseType,
  OAuth2Factory,
  QueryResponseMode,
  RefreshTokenGrantType,
  S256PkceMethod,
} from '@guarani/oauth2-server';

import { AccessTokenService } from '../services/access-token.service';
import { AuthorizationCodeService } from '../services/authorization-code.service';
import { ClientService } from '../services/client.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { UserService } from '../services/user.service';

@AuthorizationServerMetadata({
  issuer: 'http://localhost:3000',
  scopes: ['openid', 'profile', 'email', 'phone', 'address', 'api'],
  errorUrl: '/oauth2/error',
  clientAuthenticationMethods: [ClientSecretBasicClientAuthentication],
  grantTypes: [AuthorizationCodeGrantType, RefreshTokenGrantType],
  responseTypes: [CodeResponseType],
  responseModes: [QueryResponseMode],
  pkceMethods: [S256PkceMethod],
  accessTokenService: new AccessTokenService(),
  clientService: new ClientService(),
  authorizationCodeService: new AuthorizationCodeService(),
  refreshTokenService: new RefreshTokenService(),
  userService: new UserService(),
})
class Provider extends AuthorizationServer {}

export const provider = OAuth2Factory.create(Provider);
