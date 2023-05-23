import { DependencyInjectionContainer } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DeleteRegistrationContext } from '../context/registration/delete.registration.context';
import { GetRegistrationContext } from '../context/registration/get.registration.context';
import { PostRegistrationContext } from '../context/registration/post.registration.context';
import { PutRegistrationContext } from '../context/registration/put.registration.context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { DeleteRegistrationRequest } from '../requests/registration/delete.registration-request';
import { GetRegistrationRequest } from '../requests/registration/get.registration-request';
import { PostRegistrationRequest } from '../requests/registration/post.registration-request';
import { PutBodyRegistrationRequest } from '../requests/registration/put-body.registration-request';
import { PutQueryRegistrationRequest } from '../requests/registration/put-query.registration-request';
import { GetRegistrationResponse } from '../responses/registration/get.registration-response';
import { PostRegistrationResponse } from '../responses/registration/post.registration-response';
import { PutRegistrationResponse } from '../responses/registration/put.registration-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { RegistrationRequestValidator } from '../validators/registration-request.validator';
import { Endpoint } from './endpoint.type';
import { RegistrationEndpoint } from './registration.endpoint';

jest.mock('../validators/registration-request.validator');

const now = 1700000000000;

const clientSecrets: [Partial<Client>, Partial<PostRegistrationResponse>][] = [
  [
    {
      secret: undefined,
      secretIssuedAt: undefined,
      secretExpiresAt: undefined,
    },
    {
      client_secret: undefined,
      client_id_issued_at: undefined,
      client_secret_expires_at: undefined,
    },
  ],
  [
    {
      secret: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
      secretIssuedAt: new Date(now),
      secretExpiresAt: undefined,
    },
    {
      client_secret: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
      client_id_issued_at: Math.floor(now / 1000),
      client_secret_expires_at: 0,
    },
  ],
  [
    {
      secret: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
      secretIssuedAt: new Date(now),
      secretExpiresAt: new Date(now + 86400000),
    },
    {
      client_secret: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
      client_id_issued_at: Math.floor(now / 1000),
      client_secret_expires_at: Math.floor((now + 86400000) / 1000),
    },
  ],
];

describe('Dynamic Client Registration Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: RegistrationEndpoint;

  const validatorMock = jest.mocked(RegistrationRequestValidator.prototype, true);

  const settings = <Settings>{ issuer: 'https://server.example.com' };

  const clientServiceMock = jest.mocked<ClientServiceInterface>(
    {
      create: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    },
    true
  );

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>(
    {
      create: jest.fn(),
      createRegistrationAccessToken: jest.fn(),
      findOne: jest.fn(),
      revoke: jest.fn(),
    },
    true
  );

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(RegistrationRequestValidator).toValue(validatorMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(RegistrationEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(RegistrationEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "registration" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('registration');
    });
  });

  describe('path', () => {
    it('should have "/oauth/register" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/register');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["DELETE", "GET", "POST", "PUT"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual<HttpMethod[]>(['DELETE', 'GET', 'POST', 'PUT']);
    });
  });

  describe('headers', () => {
    it('should have a default "headers" object for the http response.', () => {
      expect(endpoint['headers']).toStrictEqual<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
    });
  });

  describe('constructor', () => {
    it('should throw when the client service does not implement the method "create".', () => {
      const clientServiceMock = jest.mocked<ClientServiceInterface>({ findOne: jest.fn() });

      container.delete<ClientServiceInterface>(CLIENT_SERVICE);
      container.delete(RegistrationEndpoint);

      container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
      container.bind(RegistrationEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(RegistrationEndpoint)).toThrow(
        new TypeError('Missing implementation of required method "ClientServiceInterface.create".')
      );
    });

    it('should throw when the client service does not implement the method "remove".', () => {
      const clientServiceMock = jest.mocked<ClientServiceInterface>({ create: jest.fn(), findOne: jest.fn() });

      container.delete<ClientServiceInterface>(CLIENT_SERVICE);
      container.delete(RegistrationEndpoint);

      container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
      container.bind(RegistrationEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(RegistrationEndpoint)).toThrow(
        new TypeError('Missing implementation of required method "ClientServiceInterface.remove".')
      );
    });

    it('should throw when the client service does not implement the method "update".', () => {
      const clientServiceMock = jest.mocked<ClientServiceInterface>({
        create: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
      });

      container.delete<ClientServiceInterface>(CLIENT_SERVICE);
      container.delete(RegistrationEndpoint);

      container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
      container.bind(RegistrationEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(RegistrationEndpoint)).toThrow(
        new TypeError('Missing implementation of required method "ClientServiceInterface.update".')
      );
    });

    it('should throw when the access token service does not implement the method "createRegistrationAccessToken".', () => {
      const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
        create: jest.fn(),
        findOne: jest.fn(),
        revoke: jest.fn(),
      });

      container.delete<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE);
      container.delete(RegistrationEndpoint);

      container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
      container.bind(RegistrationEndpoint).toSelf().asSingleton();

      expect(() => container.resolve(RegistrationEndpoint)).toThrow(
        new TypeError(
          'Missing implementation of required method "AccessTokenServiceInterface.createRegistrationAccessToken".'
        )
      );
    });
  });

  describe('handle() (POST)', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <PostRegistrationRequest>{
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
          subject_type: 'pairwise',
          sector_identifier_uri: 'https://client.example.com/redirect_uris.json',
          id_token_signed_response_alg: 'RS256',
          id_token_encrypted_response_alg: 'RSA-OAEP',
          id_token_encrypted_response_enc: 'A128GCM',
          // userinfo_signed_response_alg: ,
          // userinfo_encrypted_response_alg: ,
          // userinfo_encrypted_response_enc: ,
          // request_object_signing_alg: ,
          // request_object_encryption_alg: ,
          // request_object_encryption_enc: ,
          token_endpoint_auth_method: 'private_key_jwt',
          token_endpoint_auth_signing_alg: 'RS256',
          default_max_age: 60 * 60 * 24 * 15,
          require_auth_time: true,
          default_acr_values: ['guarani:acr:2fa', 'guarani:acr:1fa'],
          initiate_login_uri: 'https://client.example.com/oauth/initiate/',
          // request_uris: ,
          post_logout_redirect_uris: ['https://client.example.com/oauth/logout-callback/'],
          software_id: 'TJ9C-X43C-95V1LK03',
          software_version: 'v1.4.37',
        },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/register',
        query: {},
      });
    });

    it.each(clientSecrets)(
      'should return the metadata of the registered client.',
      async (clientParams, responseParams) => {
        const context = <PostRegistrationContext>{
          parameters: <PostRegistrationRequest>request.body,
          accessToken: { handle: 'initial_access_token', scopes: ['client:create'] },
          redirectUris: [new URL('https://client.example.com/oauth/callback/')],
          responseTypes: ['code'],
          grantTypes: ['authorization_code', 'refresh_token'],
          applicationType: 'web',
          clientName: 'Test Client #1',
          scopes: ['openid', 'profile', 'email', 'phone', 'address', 'foo', 'bar', 'baz', 'qux'],
          contacts: ['johndoe@email.com'],
          logoUri: new URL('https://some.cdn.com/client-logo.jpg'),
          clientUri: new URL('https://client.example.com/'),
          policyUri: new URL('https://client.example.com/policy/'),
          tosUri: new URL('https://client.example.com/terms-of-service/'),
          jwksUri: new URL('https://client.example.com/oauth/jwks/'),
          jwks: undefined,
          subjectType: 'pairwise',
          sectorIdentifierUri: new URL('https://client.example.com/redirect_uris.json'),
          idTokenSignedResponseAlgorithm: 'RS256',
          idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
          idTokenEncryptedResponseContentEncryption: 'A128GCM',
          // userinfoSignedResponseAlgorithm: ,
          // userinfoEncryptedResponseKeyWrap: ,
          // userinfoEncryptedResponseContentEncryption: ,
          // requestObjectSigningAlgorithm: ,
          // requestObjectEncryptionKeyWrap: ,
          // requestObjectEncryptionContentEncryption: ,
          authenticationMethod: 'private_key_jwt',
          authenticationSigningAlgorithm: 'RS256',
          defaultMaxAge: 60 * 60 * 24 * 15,
          requireAuthTime: true,
          defaultAcrValues: ['guarani:acr:2fa', 'guarani:acr:1fa'],
          initiateLoginUri: new URL('https://client.example.com/oauth/initiate/'),
          // requestUris: ,
          postLogoutRedirectUris: [new URL('https://client.example.com/oauth/logout-callback/')],
          softwareId: 'TJ9C-X43C-95V1LK03',
          softwareVersion: 'v1.4.37',
        };

        const client = <Client>{
          id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
          ...clientParams,
          name: context.clientName,
          redirectUris: context.redirectUris.map((redirectUri) => redirectUri.href),
          responseTypes: context.responseTypes,
          grantTypes: context.grantTypes,
          applicationType: context.applicationType,
          authenticationMethod: context.authenticationMethod,
          authenticationSigningAlgorithm: context.authenticationSigningAlgorithm,
          scopes: context.scopes,
          clientUri: context.clientUri?.href,
          logoUri: context.logoUri?.href,
          contacts: context.contacts,
          policyUri: context.policyUri?.href,
          tosUri: context.tosUri?.href,
          jwksUri: context.jwksUri?.href,
          jwks: context.jwks,
          subjectType: context.subjectType,
          sectorIdentifierUri: context.sectorIdentifierUri,
          idTokenSignedResponseAlgorithm: context.idTokenSignedResponseAlgorithm,
          idTokenEncryptedResponseKeyWrap: context.idTokenEncryptedResponseKeyWrap,
          idTokenEncryptedResponseContentEncryption: context.idTokenEncryptedResponseContentEncryption,
          // userinfoSignedResponseAlgorithm: ,
          // userinfoEncryptedResponseKeyWrap: ,
          // userinfoEncryptedResponseContentEncryption: ,
          // requestObjectSigningAlgorithm: ,
          // requestObjectEncryptionKeyWrap: ,
          // requestObjectEncryptionContentEncryption: ,
          defaultMaxAge: context.defaultMaxAge,
          requireAuthTime: context.requireAuthTime,
          defaultAcrValues: context.defaultAcrValues,
          initiateLoginUri: context.initiateLoginUri?.href,
          // requestUris: ,
          postLogoutRedirectUris: context.postLogoutRedirectUris.map((postLogoutRedirectUri) => {
            return postLogoutRedirectUri.href;
          }),
          softwareId: context.softwareId,
          softwareVersion: context.softwareVersion,
          createdAt: new Date(now),
        };

        const accessToken = <AccessToken>{ handle: 'registration_access_token' };

        const registrationResponse = <PostRegistrationResponse>{
          client_id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
          ...responseParams,
          registration_access_token: 'registration_access_token',
          registration_client_uri:
            'https://server.example.com/oauth/register?client_id=b1eeace9-2b0c-468e-a444-733befc3b35d',
          ...context.parameters,
        };

        validatorMock.validatePost.mockResolvedValueOnce(context);
        clientServiceMock.create!.mockResolvedValueOnce(client);
        accessTokenServiceMock.createRegistrationAccessToken!.mockResolvedValueOnce(accessToken);

        const response = await endpoint.handle(request);

        expect(response.statusCode).toBe(201);

        expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
          'Content-Type': 'application/json',
          ...endpoint['headers'],
        });

        expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(
          removeUndefined<PostRegistrationResponse>(registrationResponse)
        );

        expect(clientServiceMock.create).toHaveBeenCalledTimes(1);
        expect(clientServiceMock.create).toHaveBeenCalledWith(context);

        expect(accessTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
        expect(accessTokenServiceMock.revoke).toHaveBeenCalledWith(context.accessToken);
      }
    );
  });

  describe('handle() (GET)', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/register',
        query: { client_id: 'client_id' },
      });
    });

    it('should return the metadata of the client.', async () => {
      const client = <Client>{
        id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
        secret: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
        secretIssuedAt: new Date(now),
        secretExpiresAt: new Date(now + 86400000),
        name: 'Test Client #1',
        redirectUris: ['https://client.example.com/oauth/callback'],
        responseTypes: ['code'],
        grantTypes: ['authorization_code', 'refresh_token'],
        applicationType: 'web',
        authenticationMethod: 'private_key_jwt',
        authenticationSigningAlgorithm: 'RS256',
        scopes: ['openid', 'profile', 'email', 'phone', 'address', 'foo', 'bar', 'baz', 'qux'],
        clientUri: 'https://client.example.com',
        logoUri: 'https://some.cdn.com/client-logo.jpg',
        contacts: ['johndoe@email.com'],
        policyUri: 'https://client.example.com/policy',
        tosUri: 'https://client.example.com/terms-of-service',
        jwksUri: 'https://client.example.com/oauth/jwks',
        jwks: null,
        subjectType: 'pairwise',
        sectorIdentifierUri: 'https://client.example.com/redirect_uris.json',
        idTokenSignedResponseAlgorithm: 'RS256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128GCM',
        // userinfoSignedResponseAlgorithm: ,
        // userinfoEncryptedResponseKeyWrap: ,
        // userinfoEncryptedResponseContentEncryption: ,
        // requestObjectSigningAlgorithm: ,
        // requestObjectEncryptionKeyWrap: ,
        // requestObjectEncryptionContentEncryption: ,
        defaultMaxAge: 60 * 60 * 24 * 15,
        requireAuthTime: true,
        defaultAcrValues: ['guarani:acr:2fa', 'guarani:acr:1fa'],
        initiateLoginUri: 'https://client.example.com/oauth/initiate',
        // requestUris: ,
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback/'],
        softwareId: 'TJ9C-X43C-95V1LK03',
        softwareVersion: 'v1.4.37',
        createdAt: new Date(now),
      };

      const context = <GetRegistrationContext>{
        parameters: <GetRegistrationRequest>request.query,
        accessToken: { handle: 'access_token', client },
        client,
      };

      const clientMetadataResponse = <GetRegistrationResponse>{
        client_id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
        client_secret: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
        client_id_issued_at: Math.floor(now / 1000),
        client_secret_expires_at: Math.floor((now + 86400000) / 1000),
        registration_access_token: 'access_token',
        registration_client_uri:
          'https://server.example.com/oauth/register?client_id=b1eeace9-2b0c-468e-a444-733befc3b35d',
        redirect_uris: ['https://client.example.com/oauth/callback'],
        response_types: ['code'],
        grant_types: ['authorization_code', 'refresh_token'],
        application_type: 'web',
        client_name: 'Test Client #1',
        scope: 'openid profile email phone address foo bar baz qux',
        contacts: ['johndoe@email.com'],
        logo_uri: 'https://some.cdn.com/client-logo.jpg',
        client_uri: 'https://client.example.com',
        policy_uri: 'https://client.example.com/policy',
        tos_uri: 'https://client.example.com/terms-of-service',
        jwks_uri: 'https://client.example.com/oauth/jwks',
        jwks: undefined,
        subject_type: 'pairwise',
        sector_identifier_uri: 'https://client.example.com/redirect_uris.json',
        id_token_signed_response_alg: 'RS256',
        id_token_encrypted_response_alg: 'RSA-OAEP',
        id_token_encrypted_response_enc: 'A128GCM',
        // userinfo_signed_response_alg: ,
        // userinfo_encrypted_response_alg: ,
        // userinfo_encrypted_response_enc: ,
        // request_object_signing_alg: ,
        // request_object_encryption_alg: ,
        // request_object_encryption_enc: ,
        token_endpoint_auth_method: 'private_key_jwt',
        token_endpoint_auth_signing_alg: 'RS256',
        default_max_age: 60 * 60 * 24 * 15,
        require_auth_time: true,
        default_acr_values: ['guarani:acr:2fa', 'guarani:acr:1fa'],
        initiate_login_uri: 'https://client.example.com/oauth/initiate',
        // request_uris: ,
        post_logout_redirect_uris: ['https://client.example.com/oauth/logout-callback/'],
        software_id: 'TJ9C-X43C-95V1LK03',
        software_version: 'v1.4.37',
      };

      validatorMock.validateGet.mockResolvedValueOnce(context);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toBe(200);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/json',
        ...endpoint['headers'],
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(
        removeUndefined<GetRegistrationResponse>(clientMetadataResponse)
      );
    });
  });

  describe('handle() (DELETE)', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'DELETE',
        path: '/oauth/register',
        query: { client_id: 'client_id' },
      });
    });

    it('should decomission the client from the authorization server.', async () => {
      const client = <Client>{ id: 'client_id' };

      const context = <DeleteRegistrationContext>{
        parameters: <DeleteRegistrationRequest>request.query,
        accessToken: { handle: 'access_token' },
        client,
      };

      validatorMock.validateDelete.mockResolvedValueOnce(context);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toBe(204);
      expect(response.headers).toStrictEqual(endpoint['headers']);
      expect(response.body).toEqual(Buffer.alloc(0));

      expect(clientServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(clientServiceMock.remove).toHaveBeenCalledWith(client);

      expect(accessTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
      expect(accessTokenServiceMock.revoke).toHaveBeenCalledWith(context.accessToken);
    });
  });

  describe('handle() (PUT)', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <PutBodyRegistrationRequest>{
          client_id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
          // client_secret: ,
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
          subject_type: 'pairwise',
          sector_identifier_uri: 'https://client.example.com/redirect_uris.json',
          id_token_signed_response_alg: 'RS256',
          id_token_encrypted_response_alg: 'RSA-OAEP',
          id_token_encrypted_response_enc: 'A128GCM',
          // userinfo_signed_response_alg: ,
          // userinfo_encrypted_response_alg: ,
          // userinfo_encrypted_response_enc: ,
          // request_object_signing_alg: ,
          // request_object_encryption_alg: ,
          // request_object_encryption_enc: ,
          token_endpoint_auth_method: 'private_key_jwt',
          token_endpoint_auth_signing_alg: 'RS256',
          default_max_age: 60 * 60 * 24 * 15,
          require_auth_time: true,
          default_acr_values: ['guarani:acr:2fa', 'guarani:acr:1fa'],
          initiate_login_uri: 'https://client.example.com/oauth/initiate/',
          // request_uris: ,
          post_logout_redirect_uris: ['https://client.example.com/oauth/logout-callback/'],
          software_id: 'TJ9C-X43C-95V1LK03',
          software_version: 'v1.4.37',
        },
        cookies: {},
        headers: {},
        method: 'PUT',
        path: '/oauth/register',
        query: <PutQueryRegistrationRequest>{ client_id: 'client_id' },
      });
    });

    it('should return the updated metadata of the registered client.', async () => {
      const client = <Client>{
        id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
        secret: null,
        secretIssuedAt: null,
        secretExpiresAt: null,
        name: 'Test Client #1',
        redirectUris: ['https://client.example.com/oauth/callback/'],
        responseTypes: ['code'],
        grantTypes: ['authorization_code', 'refresh_token'],
        applicationType: 'web',
        authenticationMethod: 'private_key_jwt',
        authenticationSigningAlgorithm: 'RS256',
        scopes: ['openid', 'profile', 'email', 'phone', 'address', 'foo', 'bar', 'baz', 'qux'],
        clientUri: 'https://client.example.com/',
        logoUri: 'https://some.cdn.com/client-logo.jpg',
        contacts: ['johndoe@email.com'],
        policyUri: 'https://client.example.com/policy/',
        tosUri: 'https://client.example.com/terms-of-service/',
        jwksUri: 'https://client.example.com/oauth/jwks/',
        jwks: null,
        subjectType: 'pairwise',
        sectorIdentifierUri: 'https://client.example.com/redirect_uris.json',
        idTokenSignedResponseAlgorithm: 'RS256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128GCM',
        // userinfoSignedResponseAlgorithm: ,
        // userinfoEncryptedResponseKeyWrap: ,
        // userinfoEncryptedResponseContentEncryption: ,
        // requestObjectSigningAlgorithm: ,
        // requestObjectEncryptionKeyWrap: ,
        // requestObjectEncryptionContentEncryption: ,
        defaultMaxAge: 60 * 60 * 24 * 15,
        requireAuthTime: true,
        defaultAcrValues: ['guarani:acr:2fa', 'guarani:acr:1fa'],
        initiateLoginUri: 'https://client.example.com/oauth/initiate/',
        // requestUris: ,
        postLogoutRedirectUris: ['https://client.example.com/oauth/logout-callback/'],
        softwareId: 'TJ9C-X43C-95V1LK03',
        softwareVersion: 'v1.4.37',
        createdAt: new Date(now),
      };

      const accessToken = <AccessToken>{ handle: 'access_token', client };

      const context = <PutRegistrationContext>{
        queryParameters: <PutQueryRegistrationRequest>request.query,
        bodyParameters: <PutBodyRegistrationRequest>request.body,
        accessToken,
        client,
        clientId: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
        clientSecret: undefined,
        redirectUris: [new URL('https://client.example.com/oauth/callback/')],
        responseTypes: ['code'],
        grantTypes: ['authorization_code', 'refresh_token'],
        applicationType: 'web',
        clientName: 'Updated Test Client #1',
        scopes: ['openid', 'profile', 'email', 'phone', 'address'],
        contacts: ['johndoe@email.com'],
        logoUri: new URL('https://some.cdn.com/client-logo.jpg'),
        clientUri: new URL('https://client.example.com/'),
        policyUri: new URL('https://client.example.com/policy/'),
        tosUri: new URL('https://client.example.com/terms-of-service/'),
        jwksUri: new URL('https://client.example.com/oauth/jwks/'),
        jwks: undefined,
        subjectType: 'pairwise',
        sectorIdentifierUri: new URL('https://client.example.com/redirect_uris.json'),
        idTokenSignedResponseAlgorithm: 'RS256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128GCM',
        // userinfoSignedResponseAlgorithm: ,
        // userinfoEncryptedResponseKeyWrap: ,
        // userinfoEncryptedResponseContentEncryption: ,
        // requestObjectSigningAlgorithm: ,
        // requestObjectEncryptionKeyWrap: ,
        // requestObjectEncryptionContentEncryption: ,
        authenticationMethod: 'private_key_jwt',
        authenticationSigningAlgorithm: 'RS256',
        defaultMaxAge: 60 * 60 * 24 * 15,
        requireAuthTime: true,
        defaultAcrValues: ['guarani:acr:2fa', 'guarani:acr:1fa'],
        initiateLoginUri: new URL('https://client.example.com/oauth/initiate/'),
        // requestUris: ,
        postLogoutRedirectUris: [new URL('https://client.example.com/oauth/logout-callback/')],
        softwareId: 'TJ9C-X43C-95V1LK03',
        softwareVersion: 'v1.4.37',
      };

      const registrationResponse = <PutRegistrationResponse>{
        registration_access_token: 'access_token',
        registration_client_uri:
          'https://server.example.com/oauth/register?client_id=b1eeace9-2b0c-468e-a444-733befc3b35d',
        ...context.bodyParameters,
      };

      validatorMock.validatePut.mockResolvedValueOnce(context);

      clientServiceMock.update!.mockImplementationOnce(async (client, context) => {
        Object.assign<Client, Partial<Client>>(client, { name: context.clientName, scopes: context.scopes });
      });

      const response = await endpoint.handle(request);

      expect(response.statusCode).toBe(200);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/json',
        ...endpoint['headers'],
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(
        removeUndefined<PutRegistrationResponse>(registrationResponse)
      );
    });
  });
});
