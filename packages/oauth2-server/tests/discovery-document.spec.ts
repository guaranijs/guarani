import express, { Application, urlencoded } from 'express';
import request from 'supertest';

import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';
import { DiscoveryResponse } from '../src/lib/responses/discovery-response';

describe('Discovery Document', () => {
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

  it('GET /.well-known/openid-configuration', async () => {
    const response = await request(app).get('/.well-known/openid-configuration');

    expect(response.status).toEqual(200);

    expect(response.body).toStrictEqual<DiscoveryResponse>({
      issuer: 'http://localhost:3000',
      authorization_endpoint: 'http://localhost:3000/oauth/authorize',
      token_endpoint: 'http://localhost:3000/oauth/token',
      userinfo_endpoint: 'http://localhost:3000/oauth/userinfo',
      jwks_uri: 'http://localhost:3000/oauth/jwks',
      registration_endpoint: 'http://localhost:3000/oauth/register',
      scopes_supported: ['openid', 'profile', 'email', 'phone', 'address', 'foo', 'bar', 'baz', 'qux'],
      response_types_supported: [
        'code',
        'id_token',
        'token',
        'code id_token',
        'code token',
        'id_token token',
        'code id_token token',
      ],
      response_modes_supported: ['form_post', 'fragment', 'query'],
      grant_types_supported: [
        'authorization_code',
        'client_credentials',
        'password',
        'refresh_token',
        'urn:ietf:params:oauth:grant-type:device_code',
        'urn:ietf:params:oauth:grant-type:jwt-bearer',
      ],
      acr_values_supported: ['urn:guarani:acr:1fa', 'urn:guarani:acr:2fa'],
      subject_types_supported: ['pairwise', 'public'],
      id_token_signing_alg_values_supported: [
        'ES256',
        'ES384',
        'ES512',
        'EdDSA',
        'PS256',
        'PS384',
        'PS512',
        'RS256',
        'RS384',
        'RS512',
      ],
      id_token_encryption_alg_values_supported: [
        'A128GCMKW',
        'A128KW',
        'A192GCMKW',
        'A192KW',
        'A256GCMKW',
        'A256KW',
        'ECDH-ES',
        'ECDH-ES+A128KW',
        'ECDH-ES+A192KW',
        'ECDH-ES+A256KW',
        'RSA-OAEP',
        'RSA-OAEP-256',
        'RSA-OAEP-384',
        'RSA-OAEP-512',
        'RSA1_5',
        'dir',
      ],
      id_token_encryption_enc_values_supported: [
        'A128CBC-HS256',
        'A128GCM',
        'A192CBC-HS384',
        'A192GCM',
        'A256CBC-HS512',
        'A256GCM',
      ],
      userinfo_signing_alg_values_supported: [
        'ES256',
        'ES384',
        'ES512',
        'EdDSA',
        'PS256',
        'PS384',
        'PS512',
        'RS256',
        'RS384',
        'RS512',
      ],
      userinfo_encryption_alg_values_supported: [
        'A128GCMKW',
        'A128KW',
        'A192GCMKW',
        'A192KW',
        'A256GCMKW',
        'A256KW',
        'ECDH-ES',
        'ECDH-ES+A128KW',
        'ECDH-ES+A192KW',
        'ECDH-ES+A256KW',
        'RSA-OAEP',
        'RSA-OAEP-256',
        'RSA-OAEP-384',
        'RSA-OAEP-512',
        'RSA1_5',
        'dir',
      ],
      userinfo_encryption_enc_values_supported: [
        'A128CBC-HS256',
        'A128GCM',
        'A192CBC-HS384',
        'A192GCM',
        'A256CBC-HS512',
        'A256GCM',
      ],
      prompt_values_supported: ['consent', 'create', 'login', 'none', 'select_account'],
      display_values_supported: ['page', 'popup', 'touch', 'wap'],
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
        'EdDSA',
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
      ui_locales_supported: ['en', 'es', 'pt-BR'],
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
        'EdDSA',
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
        'EdDSA',
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
      device_authorization_endpoint: 'http://localhost:3000/oauth/device_authorization',
      end_session_endpoint: 'http://localhost:3000/oauth/end_session',
      authorization_response_iss_parameter_supported: true,
    });
  });
});
