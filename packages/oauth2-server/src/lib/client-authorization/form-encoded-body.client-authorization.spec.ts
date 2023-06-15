import { Buffer } from 'buffer';
import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary, OneOrMany } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientAuthorization } from './client-authorization.type';
import { FormEncodedBodyClientAuthorization } from './form-encoded-body.client-authorization';
import { FormEncodedBodyClientAuthorizationParameters } from './form-encoded-body.client-authorization.parameters';

const methodRequests: [Dictionary<OneOrMany<string>>, boolean][] = [
  [{}, false],
  [{ access_token: '' }, true],
  [{ access_token: 'foo' }, true],
];

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
    const requestFactory = (data: Partial<FormEncodedBodyClientAuthorizationParameters> = {}): HttpRequest => {
      return new HttpRequest({
        body: Buffer.from(stringifyQs(data), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/userinfo'),
      });
    };

    it.each(methodRequests)('should check if the authorization method has beed requested.', (body, expected) => {
      const request = requestFactory(body);
      expect(clientAuthorization.hasBeenRequested(request)).toEqual(expected);
    });
  });

  describe('authorize()', () => {
    let parameters: FormEncodedBodyClientAuthorizationParameters;

    const requestFactory = (data: Partial<FormEncodedBodyClientAuthorizationParameters> = {}): HttpRequest => {
      parameters = Object.assign(parameters, data);

      return new HttpRequest({
        body: Buffer.from(stringifyQs(parameters), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/userinfo'),
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
        'Invalid Access Token.'
      );
    });

    it('should throw when the access token is expired.', async () => {
      const request = requestFactory();

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
      const request = requestFactory();

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
      const request = requestFactory();

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
      const request = requestFactory();

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
