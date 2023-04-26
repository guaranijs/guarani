import { getContainer } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';
import express, { Application, json } from 'express';
import request, { SuperAgentTest } from 'supertest';
import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { InvalidTokenException } from '../src/lib/exceptions/invalid-token.exception';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';
import { PostRegistrationRequest } from '../src/lib/requests/registration/post.registration-request';
import { PutBodyRegistrationRequest } from '../src/lib/requests/registration/put-body.registration-request';
import { GetRegistrationResponse } from '../src/lib/responses/registration/get.registration-response';
import { PostRegistrationResponse } from '../src/lib/responses/registration/post.registration-response';
import { PutRegistrationResponse } from '../src/lib/responses/registration/put.registration-response';
import { ACCESS_TOKEN_SERVICE } from '../src/lib/services/access-token.service.token';
import { AccessTokenService } from '../src/lib/services/default/access-token.service';

describe('Dynamic Client Registration', () => {
  let app: Application;
  let agent: SuperAgentTest;
  let authorizationServer: ExpressBackend;
  let registrationAccessToken: string;
  let clientId: string;
  let clientSecret: string;

  const container = getContainer('oauth2');

  beforeAll(async () => {
    app = express();

    app.use(json());

    authorizationServer = await AuthorizationServerFactory.create(
      ExpressBackend,
      Reflect.get(global, 'endToEndAuthorizationServerOptions')
    );

    await authorizationServer.bootstrap();

    app.use(authorizationServer.router);

    agent = request.agent(app);
  });

  it('POST /oauth/register', async () => {
    const accessTokenService = container.resolve<AccessTokenService>(ACCESS_TOKEN_SERVICE);

    const initialAccessToken = await accessTokenService.createInitialAccessToken();

    const requestBody = removeUndefined<PostRegistrationRequest>({
      redirect_uris: ['https://client.example.com/oauth/callback/'],
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      client_name: 'Test Client #1',
      scope: 'openid profile email phone address foo bar baz qux',
      contacts: ['johndoe@email.com'],
      logo_uri: 'https://some.cdn.com/client-logo.jpg',
      client_uri: 'https://client.example.com/',
      policy_uri: 'https://client.example.com/policy/',
      tos_uri: 'https://client.example.com/terms-of-service/',
      jwks_uri: 'https://client.example.com/oauth/jwks/',
      jwks: undefined,
      // sector_identifier_uri: '',
      // subject_type: '',
      id_token_signed_response_alg: 'RS256',
      // id_token_encrypted_response_alg: '',
      // id_token_encrypted_response_enc: '',
      // userinfo_signed_response_alg: '',
      // userinfo_encrypted_response_alg: '',
      // userinfo_encrypted_response_enc: '',
      // request_object_signing_alg: '',
      // request_object_encryption_alg: '',
      // request_object_encryption_enc: '',
      token_endpoint_auth_method: 'private_key_jwt',
      token_endpoint_auth_signing_alg: 'RS256',
      default_max_age: 60 * 60 * 24 * 15,
      require_auth_time: true,
      default_acr_values: ['urn:guarani:acr:2fa', 'urn:guarani:acr:1fa'],
      initiate_login_uri: 'https://client.example.com/oauth/initiate/',
      // request_uris: ,
      software_id: 'TJ9C-X43C-95V1LK03',
      software_version: 'v1.4.37',
    });

    const response = await agent
      .post('/oauth/register')
      .auth(initialAccessToken.handle, { type: 'bearer' })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(requestBody);

    expect(response.status).toBe(201);

    expect(response.body).toStrictEqual<PostRegistrationResponse>({
      client_id: expect.any(String),
      client_secret: expect.any(String),
      client_id_issued_at: expect.any(Number),
      client_secret_expires_at: expect.any(Number),
      registration_access_token: expect.any(String),
      registration_client_uri: expect.stringMatching(
        /http:\/\/localhost:3000\/oauth\/register\?client_id=[a-z0-9-]{36}/
      ),
      ...requestBody,
    });

    registrationAccessToken = response.body.registration_access_token;
    clientId = response.body.client_id;
    clientSecret = response.body.client_secret;
  });

  it('GET /oauth/register (Fresh Client)', async () => {
    const response = await agent
      .get('/oauth/register')
      .query({ client_id: clientId })
      .auth(registrationAccessToken, { type: 'bearer' });

    expect(response.status).toBe(200);

    expect(response.body).toStrictEqual<GetRegistrationResponse>({
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: expect.any(Number),
      client_secret_expires_at: expect.any(Number),
      registration_access_token: expect.any(String),
      registration_client_uri: `http://localhost:3000/oauth/register?client_id=${clientId}`,
      redirect_uris: ['https://client.example.com/oauth/callback/'],
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      client_name: 'Test Client #1',
      scope: 'openid profile email phone address foo bar baz qux',
      contacts: ['johndoe@email.com'],
      logo_uri: 'https://some.cdn.com/client-logo.jpg',
      client_uri: 'https://client.example.com/',
      policy_uri: 'https://client.example.com/policy/',
      tos_uri: 'https://client.example.com/terms-of-service/',
      jwks_uri: 'https://client.example.com/oauth/jwks/',
      // jwks: undefined,
      // sector_identifier_uri: '',
      // subject_type: '',
      id_token_signed_response_alg: 'RS256',
      // id_token_encrypted_response_alg: '',
      // id_token_encrypted_response_enc: '',
      // userinfo_signed_response_alg: '',
      // userinfo_encrypted_response_alg: '',
      // userinfo_encrypted_response_enc: '',
      // request_object_signing_alg: '',
      // request_object_encryption_alg: '',
      // request_object_encryption_enc: '',
      token_endpoint_auth_method: 'private_key_jwt',
      token_endpoint_auth_signing_alg: 'RS256',
      default_max_age: 60 * 60 * 24 * 15,
      require_auth_time: true,
      default_acr_values: ['urn:guarani:acr:2fa', 'urn:guarani:acr:1fa'],
      initiate_login_uri: 'https://client.example.com/oauth/initiate/',
      // request_uris: ,
      software_id: 'TJ9C-X43C-95V1LK03',
      software_version: 'v1.4.37',
    });
  });

  it('PUT /oauth/register', async () => {
    const requestBody = removeUndefined<PutBodyRegistrationRequest>({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: ['https://client.example.com/oauth/callback/'],
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      client_name: 'Updated Test Client #1',
      scope: 'openid profile email phone address',
      contacts: ['johndoe@email.com'],
      logo_uri: 'https://some.cdn.com/client-logo.jpg',
      client_uri: 'https://client.example.com/',
      policy_uri: 'https://client.example.com/policy/',
      tos_uri: 'https://client.example.com/terms-of-service/',
      jwks_uri: 'https://client.example.com/oauth/jwks/',
      jwks: undefined,
      // sector_identifier_uri: '',
      // subject_type: '',
      id_token_signed_response_alg: 'RS256',
      // id_token_encrypted_response_alg: '',
      // id_token_encrypted_response_enc: '',
      // userinfo_signed_response_alg: '',
      // userinfo_encrypted_response_alg: '',
      // userinfo_encrypted_response_enc: '',
      // request_object_signing_alg: '',
      // request_object_encryption_alg: '',
      // request_object_encryption_enc: '',
      token_endpoint_auth_method: 'private_key_jwt',
      token_endpoint_auth_signing_alg: 'RS256',
      default_max_age: 60 * 60 * 24 * 15,
      require_auth_time: true,
      default_acr_values: ['urn:guarani:acr:2fa', 'urn:guarani:acr:1fa'],
      initiate_login_uri: 'https://client.example.com/oauth/initiate/',
      // request_uris: ,
      software_id: 'TJ9C-X43C-95V1LK03',
      software_version: 'v1.4.37',
    });

    const response = await agent
      .put('/oauth/register')
      .query({ client_id: clientId })
      .auth(registrationAccessToken, { type: 'bearer' })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(requestBody);

    expect(response.status).toBe(200);

    expect(response.body).toStrictEqual<PutRegistrationResponse>({
      ...requestBody,
      client_id_issued_at: expect.any(Number),
      client_secret_expires_at: expect.any(Number),
      registration_access_token: registrationAccessToken,
      registration_client_uri: `http://localhost:3000/oauth/register?client_id=${clientId}`,
    });
  });

  it('GET /oauth/register (Updated Client)', async () => {
    const response = await agent
      .get('/oauth/register')
      .query({ client_id: clientId })
      .auth(registrationAccessToken, { type: 'bearer' });

    expect(response.status).toBe(200);

    expect(response.body).toStrictEqual<GetRegistrationResponse>({
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: expect.any(Number),
      client_secret_expires_at: expect.any(Number),
      registration_access_token: expect.any(String),
      registration_client_uri: `http://localhost:3000/oauth/register?client_id=${clientId}`,
      redirect_uris: ['https://client.example.com/oauth/callback/'],
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      client_name: 'Updated Test Client #1',
      scope: 'openid profile email phone address',
      contacts: ['johndoe@email.com'],
      logo_uri: 'https://some.cdn.com/client-logo.jpg',
      client_uri: 'https://client.example.com/',
      policy_uri: 'https://client.example.com/policy/',
      tos_uri: 'https://client.example.com/terms-of-service/',
      jwks_uri: 'https://client.example.com/oauth/jwks/',
      // jwks: undefined,
      // sector_identifier_uri: '',
      // subject_type: '',
      id_token_signed_response_alg: 'RS256',
      // id_token_encrypted_response_alg: '',
      // id_token_encrypted_response_enc: '',
      // userinfo_signed_response_alg: '',
      // userinfo_encrypted_response_alg: '',
      // userinfo_encrypted_response_enc: '',
      // request_object_signing_alg: '',
      // request_object_encryption_alg: '',
      // request_object_encryption_enc: '',
      token_endpoint_auth_method: 'private_key_jwt',
      token_endpoint_auth_signing_alg: 'RS256',
      default_max_age: 60 * 60 * 24 * 15,
      require_auth_time: true,
      default_acr_values: ['urn:guarani:acr:2fa', 'urn:guarani:acr:1fa'],
      initiate_login_uri: 'https://client.example.com/oauth/initiate/',
      // request_uris: ,
      software_id: 'TJ9C-X43C-95V1LK03',
      software_version: 'v1.4.37',
    });
  });

  it('DELETE /oauth/register', async () => {
    const response = await agent
      .delete('/oauth/register')
      .query({ client_id: clientId })
      .auth(registrationAccessToken, { type: 'bearer' });

    expect(response.status).toBe(204);
  });

  it('GET /oauth/register (Deleted Client)', async () => {
    const response = await agent
      .get('/oauth/register')
      .query({ client_id: clientId })
      .auth(registrationAccessToken, { type: 'bearer' });

    expect(response.status).toBe(401);

    expect(response.body).toStrictEqual(new InvalidTokenException({ description: 'Revoked Access Token.' }).toJSON());
  });
});
