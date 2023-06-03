import { DependencyInjectionContainer } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { TokenContext } from '../context/token/token-context';
import { Client } from '../entities/client.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedGrantTypeException } from '../exceptions/unsupported-grant-type.exception';
import { GrantTypeInterface } from '../grant-types/grant-type.interface';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { TokenRequest } from '../requests/token/token-request';
import { TokenResponse } from '../responses/token-response';
import { TokenRequestValidator } from '../validators/token/token-request.validator';
import { Endpoint } from './endpoint.type';
import { TokenEndpoint } from './token.endpoint';

jest.mock('../validators/token/token-request.validator');

describe('Token Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: TokenEndpoint;

  const validatorsMocks = [jest.mocked(TokenRequestValidator.prototype, true)];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    validatorsMocks.forEach((validatorMock) => {
      container.bind(TokenRequestValidator).toValue(validatorMock);
    });

    container.bind(TokenEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(TokenEndpoint);
  });

  describe('name', () => {
    it('should have "token" as its value.', () => {
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
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
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

    it('should return a token response.', async () => {
      const accessTokenResponse: TokenResponse = {
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      };

      const context = <TokenContext<TokenRequest>>{
        parameters: <TokenRequest>request.body,
        client: <Client>{ id: 'client_id' },
        grantType: jest.mocked<GrantTypeInterface>({
          name: 'authorization_code',
          handle: jest.fn().mockResolvedValueOnce(accessTokenResponse),
        }),
      };

      validatorsMocks[0]!.validate.mockResolvedValueOnce(context);

      await expect(endpoint.handle(request)).resolves.toStrictEqual(
        new HttpResponse().setHeaders(endpoint['headers']).json(accessTokenResponse)
      );
    });
  });
});
