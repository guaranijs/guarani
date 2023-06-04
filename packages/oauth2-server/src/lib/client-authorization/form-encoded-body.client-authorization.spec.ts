import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientAuthorization } from './client-authorization.type';
import {
  FormEncodedBodyClientAuthorization,
  FormEncodedBodyCredentials,
} from './form-encoded-body.client-authorization';

describe('Form Encoded Body Client Authorization', () => {
  let container: DependencyInjectionContainer;
  let clientAuthorization: FormEncodedBodyClientAuthorization;

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind(FormEncodedBodyClientAuthorization).toSelf().asSingleton();

    clientAuthorization = container.resolve(FormEncodedBodyClientAuthorization);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "form_encoded_body" as its name.', () => {
      expect(clientAuthorization.name).toEqual<ClientAuthorization>('form_encoded_body');
    });
  });

  describe('hasBeenRequested()', () => {
    const methodRequests: [Dictionary<unknown>, boolean][] = [
      [{}, false],
      [{ access_token: '' }, true],
      [{ access_token: 'foo' }, true],
    ];

    it.each(methodRequests)('should check if the authorization method has beed requested.', (body, expected) => {
      const request = new HttpRequest({
        body,
        cookies: {},
        headers: {},
        method: 'POST',
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
        body: <FormEncodedBodyCredentials>{ access_token: 'access_token' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/userinfo',
        query: {},
      });
    });

    it('should throw when no access token is found.', async () => {
      accessTokenServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthorization.authorize(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Invalid Access Token.'
      );
    });

    it('should throw when the access token is expired.', async () => {
      const accessToken = <AccessToken>{
        handle: 'access_token',
        expiresAt: new Date(Date.now() - 3600000),
      };

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
