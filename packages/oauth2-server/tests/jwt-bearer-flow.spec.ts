import { JsonWebSignature, JsonWebSignatureHeader, JsonWebTokenClaims, OctetSequenceKey } from '@guarani/jose';

import { Buffer } from 'buffer';
import express, { Application, urlencoded } from 'express';
import request from 'supertest';
import { URLSearchParams } from 'url';

import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { JwtBearerTokenRequest } from '../src/lib/requests/token/jwt-bearer.token-request';
import { TokenResponse } from '../src/lib/responses/token-response';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';

describe('Client Credentials Flow', () => {
  let app: Application;
  let authorizationServer: ExpressBackend;

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

  it('POST /oauth/token', async () => {
    const header = new JsonWebSignatureHeader({ alg: 'HS256', typ: 'JWT' });
    const claims = new JsonWebTokenClaims({
      iss: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
      sub: '16907c32-687b-493c-85ba-f41f2c9d4daa',
      aud: 'http://localhost:3000/oauth/token',
      exp: Math.ceil((Date.now() + 300000) / 1000),
    });

    const key = new OctetSequenceKey({
      kty: 'oct',
      k: Buffer.from('z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', 'utf8').toString('base64url'),
    });

    const jws = new JsonWebSignature(header, claims.toBuffer());
    const assertion = await jws.sign(key);

    const requestData: JwtBearerTokenRequest = { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion };
    const requestBody = new URLSearchParams(requestData);

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
    });
  });
});
