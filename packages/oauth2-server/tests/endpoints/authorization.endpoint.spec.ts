import { Attributes, Optional } from '@guarani/types';

import { URL, URLSearchParams } from 'url';

import { AuthorizationServerOptions } from '../../lib/authorization-server/options/authorization-server.options';
import { AuthorizationEndpoint } from '../../lib/endpoints/authorization.endpoint';
import { Client } from '../../lib/entities/client';
import { AccessDeniedException } from '../../lib/exceptions/access-denied.exception';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { InvalidScopeException } from '../../lib/exceptions/invalid-scope.exception';
import { UnauthorizedClientException } from '../../lib/exceptions/unauthorized-client.exception';
import { UnsupportedResponseTypeException } from '../../lib/exceptions/unsupported-response-type.exception';
import { ScopeHandler } from '../../lib/handlers/scope.handler';
import { HttpRequest } from '../../lib/http/http.request';
import { HttpResponse } from '../../lib/http/http.response';
import { IResponseMode } from '../../lib/response-modes/response-mode.interface';
import { IResponseType } from '../../lib/response-types/response-type.interface';
import { IClientService } from '../../lib/services/client.service.interface';
import { Endpoint } from '../../lib/types/endpoint';
import { HttpMethod } from '../../lib/types/http-method';

const clients = <Client[]>[
  {
    id: 'client_id',
    redirectUris: ['https://example.com/callback'],
    responseTypes: ['code'],
    scopes: ['foo', 'bar', 'baz'],
  },
];

const responseTypesMock: jest.Mocked<IResponseType>[] = [
  { name: 'code', defaultResponseMode: 'query', handle: jest.fn() },
  { name: 'token', defaultResponseMode: 'fragment', handle: jest.fn() },
];

const responseModesMock: jest.Mocked<IResponseMode>[] = [
  { name: 'query', createHttpResponse: jest.fn() },
  { name: 'fragment', createHttpResponse: jest.fn() },
];

const clientServiceMock: jest.Mocked<Partial<IClientService>> = {
  findClient: jest.fn().mockImplementation(async (clientId: string): Promise<Optional<Client>> => {
    return clients.find((client) => client.id === clientId);
  }),
};

const authorizationServerOptionsMock = <AuthorizationServerOptions>{
  issuer: 'https://server.example.com',
  scopes: ['foo', 'bar', 'baz', 'qux'],
  userInteraction: { errorUrl: '/oauth/error', loginUrl: '/auth/login' },
};

const scopeHandler = new ScopeHandler(authorizationServerOptionsMock);

const endpoint = new AuthorizationEndpoint(
  responseTypesMock,
  responseModesMock,
  <IClientService>clientServiceMock,
  scopeHandler,
  authorizationServerOptionsMock
);

describe('Authorization Endpoint', () => {
  describe('name', () => {
    it('should have "authorization" as its name.', () => {
      expect(endpoint.name).toBe<Endpoint>('authorization');
    });
  });

  describe('path', () => {
    it('should have "/oauth/authorize" as its default path.', () => {
      expect(endpoint.path).toBe('/oauth/authorize');
    });
  });

  describe('methods', () => {
    it('should have "[\'get\']" as its methods.', () => {
      expect(endpoint.methods).toStrictEqual<HttpMethod[]>(['get']);
    });
  });

  describe('errorUrl', () => {
    it('should be defined based on the provided user interaction.', () => {
      expect(endpoint['errorUrl']).toBe('https://server.example.com/oauth/error');
    });
  });

  describe('loginUrl', () => {
    it('should be defined based on the provided user interaction.', () => {
      expect(endpoint['loginUrl']).toBe('https://server.example.com/auth/login');
    });
  });

  describe('constructor', () => {
    it('should reject not providing a user interaction object.', () => {
      expect(() => new AuthorizationEndpoint([], [], <any>{}, scopeHandler, <any>{})).toThrow(TypeError);
    });
  });

  describe('handle()', () => {
    const request = new HttpRequest({ body: {}, headers: {}, method: 'get', query: {}, user: { id: 'user_id' } });

    beforeEach(() => {
      Reflect.set(request, 'query', {
        response_type: 'code',
        client_id: 'client_id',
        redirect_uri: 'https://example.com/callback',
        scope: 'foo bar',
        state: 'client-state',
      });
    });

    it('should reject using a http method other than "get" or "post".', async () => {
      Reflect.set(request, 'method', 'delete');
      await expect(endpoint.handle(request)).rejects.toThrow(TypeError);
      Reflect.set(request, 'method', 'get');
    });

    it('should reject not providing a "response_type" parameter.', async () => {
      delete request.query.response_type;

      const error = new InvalidRequestException('Invalid parameter "response_type".');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should reject not providing a "client_id" parameter.', async () => {
      delete request.query.client_id;

      const error = new InvalidRequestException('Invalid parameter "client_id".');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should reject not providing a "redirect_uri" parameter.', async () => {
      delete request.query.redirect_uri;

      const error = new InvalidRequestException('Invalid parameter "redirect_uri".');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should reject not providing a "scope" parameter.', async () => {
      delete request.query.scope;

      const error = new InvalidRequestException('Invalid parameter "scope".');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should reject when a client is not found.', async () => {
      request.query.client_id = 'unknown';

      const error = new InvalidClientException('Invalid Client.');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should reject requesting an unsupported response type.', async () => {
      request.query.response_type = 'unknown';

      const error = new UnsupportedResponseTypeException('Unsupported response_type "unknown".');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should reject when a client requests a response type that it is not allowed to request.', async () => {
      request.query.response_type = 'token';

      const error = new UnauthorizedClientException('This Client is not allowed to request the response_type "token".');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should reject when a client provides a redirect uri that it is not allowed to use.', async () => {
      request.query.redirect_uri = 'https://bad.example.com/callback';

      const error = new AccessDeniedException('Invalid Redirect URI.');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should reject requesting an unsupported scope.', async () => {
      request.query.scope = 'foo unknown bar';

      const error = new InvalidScopeException('Unsupported scope "unknown".');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should reject requesting an unsupported response mode.', async () => {
      request.query.response_mode = 'unknown';

      const error = new InvalidRequestException('Unsupported response_mode "unknown".');
      const params = new URLSearchParams(error.toJSON());

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/oauth/error?${params.toString()}` },
        statusCode: 303,
      });
    });

    it('should return a http redirect response to the login page when no authenticated user is found.', async () => {
      delete request.user;

      const redirectTo = new URL(endpoint['path'], authorizationServerOptionsMock.issuer);
      const redirectToParams = new URLSearchParams(request.query);
      redirectTo.search = redirectToParams.toString();

      const params = new URLSearchParams({ redirect_to: redirectTo.href });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: `https://server.example.com/auth/login?${params.toString()}` },
        statusCode: 303,
      });

      request.user = { id: 'user_id' };
    });

    it('should return a valid authorization response.', async () => {
      responseTypesMock[0].handle.mockResolvedValue({ code: 'code', state: request.query.state });

      responseModesMock[0].createHttpResponse.mockImplementation((redirectUri, params) => {
        const url = new URL(redirectUri);
        url.search = new URLSearchParams(params).toString();
        return new HttpResponse().redirect(url);
      });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.alloc(0),
        headers: { Location: 'https://example.com/callback?code=code&state=client-state' },
        statusCode: 303,
      });

      responseModesMock[0].createHttpResponse.mockReset();
      responseTypesMock[0].handle.mockReset();
    });
  });
});
