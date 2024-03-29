import express, { Application, urlencoded } from 'express';
import { stringify as stringifyQs } from 'querystring';
import request from 'supertest';

import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';
import { RefreshTokenTokenRequest } from '../src/lib/requests/token/refresh-token.token-request';
import { ResourceOwnerPasswordCredentialsTokenRequest } from '../src/lib/requests/token/resource-owner-password-credentials.token-request';
import { TokenResponse } from '../src/lib/responses/token-response';

describe('Refresh Token Flow', () => {
  let app: Application;
  let authorizationServer: ExpressBackend;

  beforeAll(async () => {
    app = express();

    app.use(urlencoded({ extended: false }));

    authorizationServer = await AuthorizationServerFactory.create(
      ExpressBackend,
      Reflect.get(global, 'endToEndAuthorizationServerOptions'),
    );

    await authorizationServer.bootstrap();

    app.use(authorizationServer.router);
  });

  it('POST /oauth/token', async () => {
    // #region First round to get the initial Access Token and Refresh Token.
    const accessTokenRequestData: ResourceOwnerPasswordCredentialsTokenRequest = {
      grant_type: 'password',
      username: 'johndoe',
      password: 'secretpassword',
    };

    const accessTokenRequestBody = stringifyQs(accessTokenRequestData);

    const accessTokenResponse = await request(app)
      .post('/oauth/token')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' })
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(accessTokenRequestBody);

    expect(accessTokenResponse.status).toEqual(200);

    expect(accessTokenResponse.body).toStrictEqual<TokenResponse>({
      access_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email phone address foo bar baz qux',
      refresh_token: expect.any(String),
    });
    // #endregion

    // #region Second round to actually use the Refresh Token.
    const refreshToken = accessTokenResponse.body.refresh_token;

    const refreshTokenRequestData: RefreshTokenTokenRequest = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const refreshTokenRequestBody = stringifyQs(refreshTokenRequestData);

    const refreshTokenResponse = await request(app)
      .post('/oauth/token')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' })
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(refreshTokenRequestBody);

    expect(refreshTokenResponse.status).toEqual(200);

    expect(refreshTokenResponse.body).toStrictEqual<TokenResponse>({
      access_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email phone address foo bar baz qux',
      refresh_token: refreshToken,
    });

    expect(accessTokenResponse.body.access_token).not.toEqual(refreshTokenResponse.body.access_token);
    // #endregion
  });
});
