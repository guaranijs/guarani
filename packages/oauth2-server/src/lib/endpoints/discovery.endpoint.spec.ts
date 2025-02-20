import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { JSON } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { DiscoveryResponse } from '../responses/discovery-response';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { DiscoveryEndpoint } from './discovery.endpoint';
import { EndpointInterface } from './endpoint.interface';
import { ENDPOINT } from './endpoint.token';
import { Endpoint } from './endpoint.type';

jest.mock('../logger/logger');

describe('Discovery Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: DiscoveryEndpoint;

  const loggerMock = jest.mocked(Logger.prototype);

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    scopes: ['foo', 'bar', 'baz', 'qux'],
    clientAuthenticationMethods: ['client_secret_basic', 'private_key_jwt'],
    clientAuthenticationSignatureAlgorithms: ['HS256', 'RS256'],
    idTokenSignatureAlgorithms: ['ES256', 'RS256'],
    idTokenKeyWrapAlgorithms: ['A128KW', 'ECDH-ES', 'RSA-OAEP'],
    idTokenContentEncryptionAlgorithms: ['A128CBC-HS256', 'A128GCM'],
    userinfoSignatureAlgorithms: ['ES256', 'RS256'],
    userinfoKeyWrapAlgorithms: ['A128KW', 'ECDH-ES', 'RSA-OAEP'],
    userinfoContentEncryptionAlgorithms: ['A128CBC-HS256', 'A128GCM'],
    authorizationSignatureAlgorithms: ['ES256', 'RS256'],
    authorizationKeyWrapAlgorithms: ['A128KW', 'ECDH-ES', 'RSA-OAEP'],
    authorizationContentEncryptionAlgorithms: ['A128CBC-HS256', 'A128GCM'],
    grantTypes: ['authorization_code', 'refresh_token'],
    responseTypes: ['code'],
    responseModes: ['query'],
    pkces: ['S256'],
    displays: ['page', 'popup', 'touch', 'wap'],
    acrValues: ['urn:guarani:acr:1fa', 'urn:guarani:acr:2fa'],
    uiLocales: ['en', 'es', 'pt-BR'],
    subjectTypes: ['pairwise', 'public'],
    enableBackChannelLogout: true,
    includeSessionIdInLogoutToken: true,
    enableAuthorizationResponseIssuerIdentifier: true,
  };

  const endpoints = <jest.MockedObject<EndpointInterface>[]>[
    jest.mocked<Partial<EndpointInterface>>({ name: 'authorization', path: '/oauth/authorize' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'device_authorization', path: '/oauth/device_authorization' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'end_session', path: '/oauth/end_session' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'interaction', path: '/oauth/interaction' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'introspection', path: '/oauth/introspect' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'jwks', path: '/oauth/jwks' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'registration', path: '/oauth/register' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'revocation', path: '/oauth/revoke' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'token', path: '/oauth/token' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'userinfo', path: '/oauth/userinfo' }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    endpoints.forEach((endpoint) => container.bind<EndpointInterface>(ENDPOINT).toValue(endpoint));

    container.bind(DependencyInjectionContainer).toValue(container);
    container.bind(Logger).toValue(loggerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(DiscoveryEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(DiscoveryEndpoint);
  });

  describe('name', () => {
    it('should have "discovery" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('discovery');
    });
  });

  describe('path', () => {
    it('should have "/.well-known/openid-configuration" as its default path.', () => {
      expect(endpoint.path).toEqual('/.well-known/openid-configuration');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toEqual<HttpMethod[]>(['GET']);
    });
  });

  describe('handle', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL('https://server.example.com/.well-known/openid-configuration'),
      });
    });

    it('should return the configuration of the authorization server at the response body.', async () => {
      const discoveryResponse: DiscoveryResponse = {
        issuer: 'https://server.example.com',
        authorization_endpoint: 'https://server.example.com/oauth/authorize',
        token_endpoint: 'https://server.example.com/oauth/token',
        userinfo_endpoint: 'https://server.example.com/oauth/userinfo',
        jwks_uri: 'https://server.example.com/oauth/jwks',
        registration_endpoint: 'https://server.example.com/oauth/register',
        scopes_supported: ['foo', 'bar', 'baz', 'qux'],
        response_types_supported: ['code'],
        response_modes_supported: ['query'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        acr_values_supported: ['urn:guarani:acr:1fa', 'urn:guarani:acr:2fa'],
        subject_types_supported: ['pairwise', 'public'],
        id_token_signing_alg_values_supported: ['ES256', 'RS256'],
        id_token_encryption_alg_values_supported: ['A128KW', 'ECDH-ES', 'RSA-OAEP'],
        id_token_encryption_enc_values_supported: ['A128CBC-HS256', 'A128GCM'],
        userinfo_signing_alg_values_supported: ['ES256', 'RS256'],
        userinfo_encryption_alg_values_supported: ['A128KW', 'ECDH-ES', 'RSA-OAEP'],
        userinfo_encryption_enc_values_supported: ['A128CBC-HS256', 'A128GCM'],
        authorization_signing_alg_values_supported: ['ES256', 'RS256'],
        authorization_encryption_alg_values_supported: ['A128KW', 'ECDH-ES', 'RSA-OAEP'],
        authorization_encryption_enc_values_supported: ['A128CBC-HS256', 'A128GCM'],
        prompt_values_supported: ['consent', 'create', 'login', 'none', 'select_account'],
        display_values_supported: ['page', 'popup', 'touch', 'wap'],
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'private_key_jwt'],
        token_endpoint_auth_signing_alg_values_supported: ['HS256', 'RS256'],
        // service_documentation: '',
        ui_locales_supported: ['en', 'es', 'pt-BR'],
        // op_policy_uri: '',
        // op_tos_uri: '',
        revocation_endpoint: 'https://server.example.com/oauth/revoke',
        revocation_endpoint_auth_methods_supported: ['client_secret_basic', 'private_key_jwt'],
        revocation_endpoint_auth_signing_alg_values_supported: ['HS256', 'RS256'],
        introspection_endpoint: 'https://server.example.com/oauth/introspect',
        introspection_endpoint_auth_methods_supported: ['client_secret_basic', 'private_key_jwt'],
        introspection_endpoint_auth_signing_alg_values_supported: ['HS256', 'RS256'],
        code_challenge_methods_supported: ['S256'],
        interaction_endpoint: 'https://server.example.com/oauth/interaction',
        device_authorization_endpoint: 'https://server.example.com/oauth/device_authorization',
        end_session_endpoint: 'https://server.example.com/oauth/end_session',
        authorization_response_iss_parameter_supported: true,
        backchannel_logout_supported: true,
        backchannel_logout_session_supported: true,
      };

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ 'Content-Type': 'application/json' });
      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(discoveryResponse);
    });
  });
});
