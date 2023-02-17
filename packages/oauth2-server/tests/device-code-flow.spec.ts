import { getContainer } from '@guarani/di';

import express, { Application, urlencoded } from 'express';
import request from 'supertest';
import { URLSearchParams } from 'url';

import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { DeviceAuthorizationResponse } from '../src/lib/messages/device-authorization-response';
import { DeviceCodeTokenRequest } from '../src/lib/messages/device-code.token-request';
import { TokenResponse } from '../src/lib/messages/token-response';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';
import { DeviceCodeServiceInterface } from '../src/lib/services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../src/lib/services/device-code.service.token';

describe('Device Code Flow', () => {
  let app: Application;
  let authorizationServer: ExpressBackend;
  let deviceCode: string;

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

  it('POST /oauth/device_authorization', async () => {
    const response = await request(app)
      .post('/oauth/device_authorization')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' });

    expect(response.status).toBe(200);

    expect(response.body).toStrictEqual<DeviceAuthorizationResponse>(
      expect.objectContaining({
        device_code: expect.stringMatching(/^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/),
        user_code: expect.stringMatching(/^[A-Z]{4}-[A-Z]{4}$/),
        verification_uri: 'http://localhost:3000/device',
        verification_uri_complete: expect.stringMatching(
          /^http:\/\/localhost:3000\/device\?user_code=([A-Z]{4}-[A-Z]{4})$/
        ),
        expires_in: 1800,
        interval: 5,
      })
    );

    deviceCode = response.body.device_code;
  });

  it('POST /oauth/token', async () => {
    // #region Out-of-band authorization
    const deviceCodeService = getContainer('oauth2').resolve<DeviceCodeServiceInterface>(DEVICE_CODE_SERVICE);
    const deviceCodeEntity = (await deviceCodeService.findOne(deviceCode))!;

    deviceCodeEntity.isAuthorized = true;

    await deviceCodeService.save(deviceCodeEntity);
    // #endregion

    // #region Polling of the device_code
    const requestData: DeviceCodeTokenRequest = {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: deviceCode,
    };

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
      scope: 'foo bar baz qux',
      refresh_token: expect.any(String),
    });
    // #endregion
  });
});
