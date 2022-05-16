import { AuthorizationServerMetadataOptions } from '@guarani/oauth2-server';

import { AccessTokenService } from './services/access-token.service';
import { AuthorizationCodeService } from './services/authorization-code.service';
import { ClientService } from './services/client.service';
import { RefreshTokenService } from './services/refresh-token.service';

export const oauthOptions = <AuthorizationServerMetadataOptions>{
  issuer: 'http://localhost:3000',
  scopes: ['openid', 'profile', 'email', 'phone', 'address'],
  clientAuthenticationMethods: ['client_secret_basic'],
  grantTypes: ['authorization_code', 'refresh_token'],
  responseTypes: ['code'],
  responseModes: ['query'],
  pkceMethods: ['S256'],
  userInteraction: {
    errorUrl: '/oauth/error',
    loginUrl: '/auth/login',
  },
  accessTokenService: new AccessTokenService(),
  clientService: new ClientService(),
  authorizationCodeService: new AuthorizationCodeService(),
  refreshTokenService: new RefreshTokenService(),
};
