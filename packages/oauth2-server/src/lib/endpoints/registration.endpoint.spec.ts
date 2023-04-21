import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { RegistrationContext } from '../context/registration.context';
import { Client } from '../entities/client.entity';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { RegistrationRequest } from '../requests/registration-request';
import { RegistrationResponse } from '../responses/registration-response';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { RegistrationRequestValidator } from '../validators/registration-request.validator';
import { Endpoint } from './endpoint.type';
import { RegistrationEndpoint } from './registration.endpoint';

jest.mock('../validators/registration-request.validator');

const now = 1700000000000;

const clientSecrets: [Partial<Client>, Partial<RegistrationResponse>][] = [
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
      client_secret_expires_at: undefined,
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
    },
    true
  );

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(RegistrationRequestValidator).toValue(validatorMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
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
    it('should have \'["POST"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual<HttpMethod[]>(['POST']);
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
  });

  describe('handle() (POST)', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <RegistrationRequest>{
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
          // sector_identifier_uri: ,
          // subject_type: ,
          id_token_signed_response_alg: 'RS256',
          // id_token_encrypted_response_alg: ,
          // id_token_encrypted_response_enc: ,
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
        const context = <RegistrationContext>{
          parameters: <RegistrationRequest>request.body,
          redirectUris: [new URL('https://client.example.com/oauth/callback')],
          responseTypes: ['code'],
          grantTypes: ['authorization_code', 'refresh_token'],
          applicationType: 'web',
          clientName: 'Test Client #1',
          scopes: ['openid', 'profile', 'email', 'phone', 'address', 'foo', 'bar', 'baz', 'qux'],
          contacts: ['johndoe@email.com'],
          logoUri: new URL('https://some.cdn.com/client-logo.jpg'),
          clientUri: new URL('https://client.example.com'),
          policyUri: new URL('https://client.example.com/policy'),
          tosUri: new URL('https://client.example.com/terms-of-service'),
          jwksUri: new URL('https://client.example.com/oauth/jwks'),
          jwks: undefined,
          // sectorIdentifierUri: ,
          // subjectType: ,
          idTokenSignedResponseAlgorithm: 'RS256',
          // idTokenEncryptedResponseKeyWrap: ,
          // idTokenEncryptedResponseContentEncryption: ,
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
          initiateLoginUri: new URL('https://client.example.com/oauth/initiate'),
          // requestUris: ,
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
          contacts: context.contacts,
          policyUri: context.policyUri?.href,
          tosUri: context.tosUri?.href,
          jwksUri: context.jwksUri?.href,
          jwks: context.jwks,
          // sectorIdentifierUri: ,
          // subjectType: ,
          idTokenSignedResponseAlgorithm: context.idTokenSignedResponseAlgorithm,
          // idTokenEncryptedResponseKeyWrap: ,
          // idTokenEncryptedResponseContentEncryption: ,
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
          softwareId: context.softwareId,
          softwareVersion: context.softwareVersion,
          registrationAccessToken: 'registration_access_token',
          createdAt: new Date(now),
        };

        validatorMock.validate.mockResolvedValueOnce(context);
        clientServiceMock.create!.mockResolvedValueOnce(client);

        const registrationResponse = <RegistrationResponse>{
          client_id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
          ...responseParams,
          registration_access_token: 'registration_access_token',
          registration_client_uri:
            'https://server.example.com/oauth/register?client_id=b1eeace9-2b0c-468e-a444-733befc3b35d',
          ...context.parameters,
        };

        await expect(endpoint.handle(request)).resolves.toStrictEqual(
          new HttpResponse().setHeaders(endpoint['headers']).json(registrationResponse)
        );

        expect(clientServiceMock.create).toHaveBeenCalledTimes(1);
        expect(clientServiceMock.create).toHaveBeenCalledWith(context);
      }
    );
  });
});
