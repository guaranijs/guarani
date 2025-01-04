import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { JSON, removeNullishValues } from '@guarani/primitives';

import { TokenContext } from '../context/token/token-context';
import { Client } from '../entities/client.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedGrantTypeException } from '../exceptions/unsupported-grant-type.exception';
import { GrantTypeInterface } from '../grant-types/grant-type.interface';
import { GrantType } from '../grant-types/grant-type.type';
import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { TokenRequest } from '../requests/token/token-request';
import { TokenResponse } from '../responses/token-response';
import { TokenRequestValidator } from '../validators/token/token-request.validator';
import { Endpoint } from './endpoint.type';
import { TokenEndpoint } from './token.endpoint';

jest.mock('../logger/logger');
jest.mock('../validators/token/token-request.validator');

describe('Token Endpoint', () => {
  let container: DependencyInjectionContainer;
  let endpoint: TokenEndpoint;

  const loggerMock = jest.mocked(Logger.prototype);
  const validatorMock = jest.mocked(TokenRequestValidator.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
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
    let parameters: TokenRequest;

    const requestFactory = (data: Partial<TokenRequest> = {}): HttpRequest => {
      removeNullishValues<TokenRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      Reflect.deleteProperty(validatorMock, 'name');

      parameters = { grant_type: 'authorization_code' };
    });

    it('should return an error response when not providing the parameter "grant_type".', async () => {
      const request = requestFactory({ grant_type: undefined });

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

      const request = requestFactory({ grant_type: 'unknown' as GrantType });

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

      const request = requestFactory({});

      const accessTokenResponse: TokenResponse = {
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      };

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const context = <TokenContext>{
        parameters,
        client,
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
