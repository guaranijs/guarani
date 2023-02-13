import { getContainer } from '@guarani/di';

import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { DiscoveryResponse } from '../messages/discovery-response';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { DiscoveryEndpoint } from './discovery.endpoint';
import { EndpointInterface } from './endpoint.interface';
import { ENDPOINT } from './endpoint.token';

describe('Discovery Endpoint', () => {
  let endpoint: DiscoveryEndpoint;

  const settings = <Settings>{
    issuer: 'https://server.example.com',
    scopes: ['foo', 'bar', 'baz', 'qux'],
    clientAuthenticationMethods: ['client_secret_basic', 'private_key_jwt'],
    clientAuthenticationSignatureAlgorithms: ['HS256', 'RS256'],
    grantTypes: ['authorization_code', 'refresh_token'],
    responseTypes: ['code'],
    responseModes: ['query'],
    pkceMethods: ['S256'],
  };

  const endpoints = <jest.MockedObject<EndpointInterface>[]>[
    jest.mocked<Partial<EndpointInterface>>({ name: 'authorization', path: '/oauth/authorize' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'interaction', path: '/oauth/interaction' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'introspection', path: '/oauth/introspect' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'revocation', path: '/oauth/revoke' }),
    jest.mocked<Partial<EndpointInterface>>({ name: 'token', path: '/oauth/token' }),
  ];

  beforeEach(() => {
    const container = getContainer('oauth2');

    endpoints.forEach((endpoint) => container.bind<EndpointInterface>(ENDPOINT).toValue(endpoint));

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(DiscoveryEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(DiscoveryEndpoint);
  });

  describe('name', () => {
    it('should have "discovery" as its name.', () => {
      expect(endpoint.name).toBe('discovery');
    });
  });

  describe('path', () => {
    it('should have "/.well-known/openid-configuration" as its default path.', () => {
      expect(endpoint.path).toBe('/.well-known/openid-configuration');
    });
  });

  describe('httpMethods', () => {
    it('should have \'["GET"]\' as its supported http methods.', () => {
      expect(endpoint.httpMethods).toStrictEqual(['GET']);
    });
  });

  describe('handle', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = {
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/.well-known/openid-configuration',
        query: {},
      };
    });

    it('should return the configuration of the authorization server at the response body.', async () => {
      const discoveryResponse: DiscoveryResponse = {
        issuer: 'https://server.example.com',
        authorization_endpoint: 'https://server.example.com/oauth/authorize',
        token_endpoint: 'https://server.example.com/oauth/token',
        // jwks_uri: '',
        scopes_supported: ['foo', 'bar', 'baz', 'qux'],
        response_types_supported: ['code'],
        response_modes_supported: ['query'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'private_key_jwt'],
        token_endpoint_auth_signing_alg_values_supported: ['HS256', 'RS256'],
        // service_documentation: '',
        // ui_locales_supported: '',
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
      };

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify(discoveryResponse), 'utf8'),
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });
  });
});
