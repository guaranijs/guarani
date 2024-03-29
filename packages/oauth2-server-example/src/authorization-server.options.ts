import dotenv from 'dotenv';
import path from 'path';

import { EllipticCurveKey, JsonWebKeySet } from '@guarani/jose';
import { AuthorizationServerOptions } from '@guarani/oauth2-server';

import { AccessTokenService } from './app/services/access-token.service';
import { AuthorizationCodeService } from './app/services/authorization-code.service';
import { ClientService } from './app/services/client.service';
import { ConsentService } from './app/services/consent.service';
import { DeviceCodeService } from './app/services/device-code.service';
import { GrantService } from './app/services/grant.service';
import { LoginService } from './app/services/login.service';
import { LogoutTicketService } from './app/services/logout-ticket.service';
import { RefreshTokenService } from './app/services/refresh-token.service';
import { SessionService } from './app/services/session.service';
import { UserService } from './app/services/user.service';

dotenv.config({ path: path.join(__dirname, '.env') });

export const authorizationServerOptions: AuthorizationServerOptions = {
  issuer: 'http://localhost:4000',
  scopes: ['openid', 'profile', 'email', 'phone', 'address'],
  jwks: new JsonWebKeySet([
    new EllipticCurveKey({
      kty: 'EC',
      crv: 'P-256',
      x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
      y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
      d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
      alg: 'ES256',
      use: 'sig',
    }),
  ]),
  userInteraction: {
    consentUrl: '/auth/consent',
    deviceCodeUrl: '/device',
    errorUrl: '/auth/error',
    loginUrl: '/auth/login',
    logoutUrl: '/auth/logout',
    registrationUrl: '/auth/register',
    selectAccountUrl: '/auth/select-account',
  },
  clientAuthenticationMethods: [
    'client_secret_basic',
    'client_secret_jwt',
    'client_secret_post',
    'none',
    'private_key_jwt',
  ],
  clientAuthenticationSignatureAlgorithms: ['ES256', 'HS256', 'RS256'],
  idTokenSignatureAlgorithms: ['ES256'],
  enableAuthorizationResponseIssuerIdentifier: true,
  enableIntrospectionEndpoint: true,
  enableRevocationEndpoint: true,
  grantTypes: [
    'authorization_code',
    'client_credentials',
    'password',
    'refresh_token',
    'urn:ietf:params:oauth:grant-type:device_code',
    'urn:ietf:params:oauth:grant-type:jwt-bearer',
  ],
  pkces: ['S256', 'plain'],
  responseModes: ['form_post', 'fragment', 'query'],
  responseTypes: ['code id_token token', 'code id_token', 'code token', 'code', 'id_token token', 'id_token', 'token'],
  acrValues: ['urn:guarani:acr:1fa'],
  subjectTypes: ['public'],
  postLogoutUrl: 'http://localhost:4000',
  secretKey: process.env.SECRET_KEY!,
  userService: UserService,
  clientService: ClientService,
  loginService: LoginService,
  consentService: ConsentService,
  sessionService: SessionService,
  grantService: GrantService,
  authorizationCodeService: AuthorizationCodeService,
  accessTokenService: AccessTokenService,
  refreshTokenService: RefreshTokenService,
  deviceCodeService: DeviceCodeService,
  logoutTicketService: LogoutTicketService,
};
