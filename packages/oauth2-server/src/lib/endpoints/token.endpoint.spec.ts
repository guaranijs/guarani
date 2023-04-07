import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnauthorizedClientException } from '../exceptions/unauthorized-client.exception';
import { UnsupportedGrantTypeException } from '../exceptions/unsupported-grant-type.exception';
import { GrantTypeInterface } from '../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../grant-types/grant-type.token';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { TokenRequest } from '../requests/token/token-request';
import { TokenResponse } from '../responses/token-response';
import { Endpoint } from './endpoint.type';
import { TokenEndpoint } from './token.endpoint';

jest.mock('../handlers/client-authentication.handler');

describe('Token Endpoint', () => {
  let endpoint: TokenEndpoint;

  const grantTypesMocks = [
    jest.mocked<GrantTypeInterface>({ name: 'authorization_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'client_credentials', handle: jest.fn() }),
  ];

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype, true);

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    grantTypesMocks.forEach((grantType) => container.bind<GrantTypeInterface>(GRANT_TYPE).toValue(grantType));

    container.bind(ClientAuthenticationHandler).toSelf().asSingleton();
    container.bind(TokenEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(TokenEndpoint);
  });

  describe('name', () => {
    it('should have "token" as its name.', () => {
      expect(endpoint.name).toEqual<Endpoint>('token');
    });
  });

  describe('path', () => {
    it('should have "/oauth/token" as its default path.', () => {
      expect(endpoint.path).toEqual('/oauth/token');
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

  describe('handle()', () => {
    let request: HttpRequest<TokenRequest>;

    beforeEach(() => {
      request = new HttpRequest<TokenRequest>({
        body: { grant_type: 'authorization_code' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      });
    });

    it('should return an error response when not providing a "grant_type" parameter.', async () => {
      delete request.body.grant_type;

      const error = new InvalidRequestException({ description: 'Invalid parameter "grant_type".' });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setStatus(error.statusCode).setHeaders(endpoint['headers']).json(error.toJSON())
      );
    });

    it('should return an error response when requesting an unsupported grant type.', async () => {
      request.body.grant_type = 'unknown';

      const error = new UnsupportedGrantTypeException({ description: 'Unsupported grant_type "unknown".' });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setStatus(error.statusCode).setHeaders(endpoint['headers']).json(error.toJSON())
      );
    });

    it('should return an error response when not using a client authentication method.', async () => {
      const error = new InvalidClientException({ description: 'No Client Authentication Method detected.' });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValue(error);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setStatus(error.statusCode).setHeaders(endpoint['headers']).json(error.toJSON())
      );
    });

    it('should return an error response when using multiple client authentication methods.', async () => {
      const error = new InvalidClientException({ description: 'Multiple Client Authentication Methods detected.' });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValue(error);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setStatus(error.statusCode).setHeaders(endpoint['headers']).json(error.toJSON())
      );
    });

    it("should return an error response when the provided secret does not match the client's one.", async () => {
      const error = new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders({
        'WWW-Authenticate': 'Basic',
      });

      clientAuthenticationHandlerMock.authenticate.mockRejectedValue(error);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse()
          .setStatus(error.statusCode)
          .setHeaders({ ...endpoint['headers'], ...error.headers })
          .json(error.toJSON())
      );
    });

    it('should return an error response when a client requests a grant type not allowed to itself.', async () => {
      const error = new UnauthorizedClientException({
        description: 'This Client is not allowed to request the grant_type "authorization_code".',
      });

      clientAuthenticationHandlerMock.authenticate.mockResolvedValue(<Client>{
        id: 'client_id',
        grantTypes: ['password'],
      });

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setStatus(error.statusCode).setHeaders(endpoint['headers']).json(error.toJSON())
      );
    });

    it('should return a token response.', async () => {
      const accessTokenResponse: TokenResponse = {
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValue(<Client>{
        id: 'client_id',
        grantTypes: ['authorization_code'],
      });

      grantTypesMocks[0]!.handle.mockResolvedValue(accessTokenResponse);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setHeaders(endpoint['headers']).json(accessTokenResponse)
      );
    });
  });
});
