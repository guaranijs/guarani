import { DependencyInjectionContainer } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientAuthorization } from './client-authorization.type';
import { UriQueryClientAuthorization } from './uri-query.client-authorization';

describe('URI Query Client Authorization', () => {
  let container: DependencyInjectionContainer;
  let clientAuthorization: UriQueryClientAuthorization;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

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
    const methodRequests: [Record<string, any>, boolean][] = [
      [{}, false],
      [{ access_token: '' }, true],
      [{ access_token: 'foo' }, true],
    ];

    it.each(methodRequests)('should check if the authorization method has beed requested.', (query, expected) => {
      const request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/userinfo',
        query,
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
        headers: {},
        method: 'GET',
        path: '/oauth/userinfo',
        query: { access_token: 'access_token' },
      });
    });

    it('should throw when no access token is found.', async () => {
      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthorization.authorize(request)).rejects.toThrow(
        new InvalidTokenException({ description: 'Invalid Access Token.' })
      );
    });

    it('should throw when the access token is expired.', async () => {
      const accessToken = <AccessToken>{ handle: 'access_token', expiresAt: new Date(Date.now() - 3600000) };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).rejects.toThrow(
        new InvalidTokenException({ description: 'Expired Access Token.' })
      );
    });

    it('should throw when the access token is not yet valid.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() + 7200000),
        validAfter: new Date(Date.now() + 3600000),
      };

      accessTokenServiceMock.findOne.mockResolvedValueOnce(accessToken);

      await expect(clientAuthorization.authorize(request)).rejects.toThrow(
        new InvalidTokenException({ description: 'The provided Access Token is not yet valid.' })
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

      await expect(clientAuthorization.authorize(request)).rejects.toThrow(
        new InvalidTokenException({ description: 'Revoked Access Token.' })
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
