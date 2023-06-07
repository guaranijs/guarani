import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { OutgoingHttpHeaders } from 'http';

import { TokenContext } from '../context/token/token-context';
import { Client } from '../entities/client.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedGrantTypeException } from '../exceptions/unsupported-grant-type.exception';
import { GrantTypeInterface } from '../grant-types/grant-type.interface';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { TokenRequest } from '../requests/token/token-request';
import { TokenResponse } from '../responses/token-response';
import { TokenRequestValidator } from '../validators/token/token-request.validator';
import { Endpoint } from './endpoint.type';
import { TokenEndpoint } from './token.endpoint';

jest.mock('../validators/token/token-request.validator');

describe('Token Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: TokenEndpoint;

  const validatorMock = jest.mocked(TokenRequestValidator.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(TokenRequestValidator).toValue(validatorMock);
    container.bind(TokenEndpoint).toSelf().asSingleton();

    endpoint = container.resolve(TokenEndpoint);
  });

  afterEach(() => {
    jest.resetAllMocks();
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
      expect(endpoint.httpMethods).toEqual<HttpMethod[]>(['POST']);
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
      Reflect.deleteProperty(validatorMock, 'name');

      request = new HttpRequest({
        body: <TokenRequest>{ grant_type: 'authorization_code' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      });
    });

    it('should return an error response when not providing a "grant_type" parameter.', async () => {
      delete request.body.grant_type;

      const error = new InvalidRequestException('Invalid parameter "grant_type".');
      const errorParameters = removeNullishValues(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(error.statusCode);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/json',
        ...error.headers,
        ...endpoint['headers'],
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(errorParameters);
    });

    it('should return an error response when requesting an unsupported grant type.', async () => {
      Reflect.set(validatorMock, 'name', 'authorization_code');

      request.body.grant_type = 'unknown';

      const error = new UnsupportedGrantTypeException('Unsupported grant_type "unknown".');
      const errorParameters = removeNullishValues(error.toJSON());

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(error.statusCode);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/json',
        ...error.headers,
        ...endpoint['headers'],
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(errorParameters);
    });

    it('should return a token response.', async () => {
      Reflect.set(validatorMock, 'name', 'authorization_code');

      const accessTokenResponse: TokenResponse = {
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      };

      const context = <TokenContext>{
        parameters: request.body as TokenRequest,
        client: <Client>{ id: 'client_id' },
        grantType: <GrantTypeInterface>{
          name: 'authorization_code',
          handle: jest.fn().mockResolvedValueOnce(accessTokenResponse),
        },
      };

      validatorMock.validate.mockResolvedValueOnce(context);

      const response = await endpoint.handle(request);

      expect(response.statusCode).toEqual(200);

      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        'Content-Type': 'application/json',
        ...endpoint['headers'],
      });

      expect(JSON.parse(response.body.toString('utf8'))).toStrictEqual(accessTokenResponse);
    });
  });
});
