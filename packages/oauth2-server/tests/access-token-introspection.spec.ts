import express, { Application, urlencoded } from 'express';
import { stringify as stringifyQs } from 'querystring';
import request from 'supertest';

import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';
import { IntrospectionRequest } from '../src/lib/requests/introspection-request';
import { ResourceOwnerPasswordCredentialsTokenRequest } from '../src/lib/requests/token/resource-owner-password-credentials.token-request';
import { IntrospectionResponse } from '../src/lib/responses/introspection-response';
import { TokenResponse } from '../src/lib/responses/token-response';

describe('Access Token Introspection', () => {
  let app: Application;
  let accessToken: string;
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
    const requestData: ResourceOwnerPasswordCredentialsTokenRequest = {
      grant_type: 'password',
      username: 'johndoe',
      password: 'secretpassword',
    };

    const requestBody = stringifyQs(requestData);

    const response = await request(app)
      .post('/oauth/token')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' })
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(requestBody);

    expect(response.status).toEqual(200);

    expect(response.body).toStrictEqual<TokenResponse>({
      access_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email phone address foo bar baz qux',
      refresh_token: expect.any(String),
    });

    accessToken = response.body.access_token;
  });

  it('POST /oauth/introspect', async () => {
    const introspectionRequestData: IntrospectionRequest = { token: accessToken, token_type_hint: 'access_token' };
    const introspectionRequestBody = stringifyQs(introspectionRequestData);

    const introspectionResponse = await request(app)
      .post('/oauth/introspect')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' })
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(introspectionRequestBody);

    expect(introspectionResponse.status).toEqual(200);

    expect(introspectionResponse.body).toStrictEqual<IntrospectionResponse>({
      active: true,
      scope: 'openid profile email phone address foo bar baz qux',
      client_id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
      // username: undefined,
      token_type: 'Bearer',
      exp: expect.any(Number),
      iat: expect.any(Number),
      nbf: expect.any(Number),
      sub: '16907c32-687b-493c-85ba-f41f2c9d4daa',
      aud: ['b1eeace9-2b0c-468e-a444-733befc3b35d'],
      iss: 'http://localhost:3000',
      // jti: undefined,
    });
  });
});
