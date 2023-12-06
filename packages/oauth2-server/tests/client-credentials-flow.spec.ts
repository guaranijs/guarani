import express, { Application, urlencoded } from 'express';
import { stringify as stringifyQs } from 'querystring';
import request from 'supertest';

import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';
import { ClientCredentialsTokenRequest } from '../src/lib/requests/token/client-credentials.token-request';
import { TokenResponse } from '../src/lib/responses/token-response';

describe('Client Credentials Flow', () => {
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
    const requestData: ClientCredentialsTokenRequest = { grant_type: 'client_credentials' };
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
    });
  });
});
