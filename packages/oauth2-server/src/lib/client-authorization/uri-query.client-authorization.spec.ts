import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary, OneOrMany } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientAuthorization } from './client-authorization.type';
import { UriQueryClientAuthorization } from './uri-query.client-authorization';
import { UriQueryClientAuthorizationParameters } from './uri-query.client-authorization.parameters';

jest.mock('../logger/logger');

const methodRequests: [Dictionary<OneOrMany<string>>, boolean][] = [
  [{}, false],
  [{ access_token: '' }, true],
  [{ access_token: 'foo' }, true],
];

describe('URI Query Client Authorization', () => {
  let container: DependencyInjectionContainer;
  let clientAuthorization: UriQueryClientAuthorization;

  const loggerMock = jest.mocked(Logger.prototype);

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(UriQueryClientAuthorization).toSelf().asSingleton();

    clientAuthorization = container.resolve(UriQueryClientAuthorization);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "uri_query" as its name.', () => {
      expect(clientAuthorization.name).toEqual<ClientAuthorization>('uri_query');
    });
  });

  describe('hasBeenRequested()', () => {
    const requestFactory = (data: Partial<UriQueryClientAuthorizationParameters> = {}): HttpRequest => {
      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/userinfo?${stringifyQs(data)}`),
      });
    };

    it.each(methodRequests)('should check if the authorization method has beed requested.', (query, expected) => {
      const request = requestFactory(query);
      expect(clientAuthorization.hasBeenRequested(request)).toEqual(expected);
    });
  });

  describe('authorize()', () => {
    let parameters: UriQueryClientAuthorizationParameters;

    const requestFactory = (data: Partial<UriQueryClientAuthorizationParameters> = {}): HttpRequest => {
      removeNullishValues<UriQueryClientAuthorizationParameters>(Object.assign(parameters, data));

      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/userinfo?${stringifyQs(parameters)}`),
      });
    };

    beforeEach(() => {
      parameters = { access_token: 'access_token' };
    });

    it('should throw when no access token is found.', async () => {
      const request = requestFactory();

      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Invalid Access Token.',
      );
    });

    it('should throw when the access token is expired.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{
        id: 'access_token',
        expiresAt: new Date(Date.now() - 3600000),
      };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Expired Access Token.',
      );
    });

    it('should throw when the access token is not yet valid.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{
        id: 'access_token',
        expiresAt: new Date(Date.now() + 7200000),
        validAfter: new Date(Date.now() + 3600000),
      };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'The provided Access Token is not yet valid.',
      );
    });

    it('should throw when the access token is revoked.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{
        id: 'access_token',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 3600000),
        validAfter: new Date(Date.now()),
      };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Revoked Access Token.',
      );
    });

    it('should return an authorized access token.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{
        id: 'access_token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 3600000),
        validAfter: new Date(Date.now()),
      };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).resolves.toBe(accessToken);
    });
  });
});
