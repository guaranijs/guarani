import { Buffer } from 'buffer';
import express, { Application, urlencoded } from 'express';
import request from 'supertest';
import { URLSearchParams } from 'url';

import { Dictionary } from '@guarani/types';

import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { OAuth2ExceptionResponse } from '../src/lib/exceptions/oauth2.exception.response';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';
import { RevocationRequest } from '../src/lib/requests/revocation-request';
import { RefreshTokenTokenRequest } from '../src/lib/requests/token/refresh-token.token-request';
import { ResourceOwnerPasswordCredentialsTokenRequest } from '../src/lib/requests/token/resource-owner-password-credentials.token-request';
import { TokenResponse } from '../src/lib/responses/token-response';

describe('Refresh Token Revocation', () => {
  let app: Application;
  let authorizationServer: ExpressBackend;
  let firstAccessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = express();

    app.use(urlencoded({ extended: false }));

    authorizationServer = await AuthorizationServerFactory.create(
      ExpressBackend,
      Reflect.get(global, 'endToEndAuthorizationServerOptions')
    );

    await authorizationServer.bootstrap();

    app.use(authorizationServer.router);
  });

  it('POST /oauth/token (Get Refresh Token)', async () => {
    const requestData: ResourceOwnerPasswordCredentialsTokenRequest = {
      grant_type: 'password',
      username: 'johndoe',
      password: 'secretpassword',
    };

    const requestBody = new URLSearchParams(requestData as Dictionary<any>);

    const response = await request(app)
      .post('/oauth/token')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' })
      .send(requestBody.toString());

    expect(response.status).toBe(200);

    expect(response.body).toStrictEqual<TokenResponse>({
      access_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email phone address foo bar baz qux',
      refresh_token: expect.any(String),
    });

    firstAccessToken = response.body.access_token;
    refreshToken = response.body.refresh_token;
  });

  it('POST /oauth/token (Use Refresh Token)', async () => {
    const refreshTokenRequestData: RefreshTokenTokenRequest = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const refreshTokenRequestBody = new URLSearchParams(refreshTokenRequestData as Dictionary<any>);

    const refreshTokenResponse = await request(app)
      .post('/oauth/token')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' })
      .send(refreshTokenRequestBody.toString());

    expect(refreshTokenResponse.status).toBe(200);

    expect(refreshTokenResponse.body).toStrictEqual<TokenResponse>({
      access_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email phone address foo bar baz qux',
      refresh_token: refreshToken,
    });

    const secondAccessToken = refreshTokenResponse.body.access_token;

    expect(firstAccessToken).not.toEqual(secondAccessToken);
  });

  it('POST /oauth/revoke', async () => {
    const revocationRequestData: RevocationRequest = { token: refreshToken, token_type_hint: 'refresh_token' };
    const revocationRequestBody = new URLSearchParams(revocationRequestData as Dictionary<any>);

    const revocationResponse = await request(app)
      .post('/oauth/revoke')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' })
      .send(revocationRequestBody.toString());

    expect(revocationResponse.status).toBe(200);
    expect(revocationResponse.body).toEqual(Buffer.alloc(0));
  });

  it('POST /oauth/token (Revoked Refresh Token)', async () => {
    const refreshTokenRequestData: RefreshTokenTokenRequest = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const refreshTokenRequestBody = new URLSearchParams(refreshTokenRequestData as Dictionary<any>);

    const refreshTokenResponse = await request(app)
      .post('/oauth/token')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' })
      .send(refreshTokenRequestBody.toString());

    expect(refreshTokenResponse.status).toBe(400);

    expect(refreshTokenResponse.body).toStrictEqual<OAuth2ExceptionResponse>({
      error: 'invalid_grant',
      error_description: 'Revoked Refresh Token.',
    });
  });
});
