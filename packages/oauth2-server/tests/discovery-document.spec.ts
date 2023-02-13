import express, { Application, urlencoded } from 'express';
import request from 'supertest';

import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { DiscoveryResponse } from '../src/lib/messages/discovery-response';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';

describe('Discovery Document', () => {
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

  it('GET /.well-known/openid-configuration', async () => {
    const response = await request(app).get('/.well-known/openid-configuration');

    expect(response.status).toBe(200);

    expect(response.body).toStrictEqual<DiscoveryResponse>({
      issuer: 'http://localhost:3000',
      authorization_endpoint: 'http://localhost:3000/oauth/authorize',
      token_endpoint: 'http://localhost:3000/oauth/token',
      // jwks_uri: '',
      scopes_supported: ['foo', 'bar', 'baz', 'qux'],
      response_types_supported: ['code', 'token'],
      response_modes_supported: ['form_post', 'fragment', 'query'],
      grant_types_supported: [
        'authorization_code',
        'client_credentials',
        'password',
        'refresh_token',
        'urn:ietf:params:oauth:grant-type:jwt-bearer',
      ],
      token_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_jwt',
        'client_secret_post',
        'none',
        'private_key_jwt',
      ],
      token_endpoint_auth_signing_alg_values_supported: [
        'ES256',
        'ES384',
        'ES512',
        'HS256',
        'HS384',
        'HS512',
        'PS256',
        'PS384',
        'PS512',
        'RS256',
        'RS384',
        'RS512',
      ],
      // service_documentation: '',
      // ui_locales_supported: '',
      // op_policy_uri: '',
      // op_tos_uri: '',
      revocation_endpoint: 'http://localhost:3000/oauth/revoke',
      revocation_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_jwt',
        'client_secret_post',
        'none',
        'private_key_jwt',
      ],
      revocation_endpoint_auth_signing_alg_values_supported: [
        'ES256',
        'ES384',
        'ES512',
        'HS256',
        'HS384',
        'HS512',
        'PS256',
        'PS384',
        'PS512',
        'RS256',
        'RS384',
        'RS512',
      ],
      introspection_endpoint: 'http://localhost:3000/oauth/introspect',
      introspection_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_jwt',
        'client_secret_post',
        'none',
        'private_key_jwt',
      ],
      introspection_endpoint_auth_signing_alg_values_supported: [
        'ES256',
        'ES384',
        'ES512',
        'HS256',
        'HS384',
        'HS512',
        'PS256',
        'PS384',
        'PS512',
        'RS256',
        'RS384',
        'RS512',
      ],
      code_challenge_methods_supported: ['S256', 'plain'],
      interaction_endpoint: 'http://localhost:3000/oauth/interaction',
    });
  });
});
