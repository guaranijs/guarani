import { IncomingHttpHeaders } from 'http';

import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationHeaderBearerClientAuthorization } from './authorization-header-bearer.client-authorization';
import { ClientAuthorization } from './client-authorization.type';

describe('Authorization Header Bearer Client Authorization', () => {
  let container: DependencyInjectionContainer;
  let clientAuthorization: AuthorizationHeaderBearerClientAuthorization;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(AuthorizationHeaderBearerClientAuthorization).toSelf().asSingleton();

    clientAuthorization = container.resolve(AuthorizationHeaderBearerClientAuthorization);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "authorization_header_bearer" as its name.', () => {
      expect(clientAuthorization.name).toEqual<ClientAuthorization>('authorization_header_bearer');
    });
  });

  describe('hasBeenRequested()', () => {
    const methodRequests: [IncomingHttpHeaders, boolean][] = [
      [{}, false],
      [{ authorization: '' }, false],
      [{ authorization: 'Basic' }, false],
      [{ authorization: 'Bearer' }, true],
      [{ authorization: 'Bearer ' }, true],
      [{ authorization: 'Bearer $' }, true],
      [{ authorization: 'Bearer 123abcDEF+/-_.~=' }, true],
    ];

    it.each(methodRequests)('should check if the authorization method has beed requested.', (headers, expected) => {
      const request = new HttpRequest({
        body: {},
        cookies: {},
        headers,
        method: 'GET',
        path: '/oauth/userinfo',
        query: {},
      });

      expect(clientAuthorization.hasBeenRequested(request)).toBe(expected);
    });
  });

  describe('authorize()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: { authorization: 'Bearer access_token' },
        method: 'GET',
        path: '/oauth/userinfo',
        query: {},
      });
    });

    it('should throw when providing an authorization header without a token.', async () => {
      request.headers.authorization = 'Bearer';

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Missing Bearer Token.'
      );
    });

    it('should throw when providing an invalid token.', async () => {
      request.headers.authorization = 'Bearer $';

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Invalid Bearer Token.'
      );
    });

    it('should throw when no access token is found.', async () => {
      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Invalid Access Token.'
      );
    });

    it('should throw when the access token is expired.', async () => {
      const accessToken = <AccessToken>{ handle: 'access_token', expiresAt: new Date(Date.now() - 3600000) };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Expired Access Token.'
      );
    });

    it('should throw when the access token is not yet valid.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 7200000),
        validAfter: new Date(Date.now() + 3600000),
      };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'The provided Access Token is not yet valid.'
      );
    });

    it('should throw when the access token is revoked.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 3600000),
        validAfter: new Date(Date.now()),
      };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Revoked Access Token.'
      );
    });

    it('should return an authorized access token.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 3600000),
        validAfter: new Date(Date.now()),
      };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).resolves.toBe(accessToken);
    });
  });
});
