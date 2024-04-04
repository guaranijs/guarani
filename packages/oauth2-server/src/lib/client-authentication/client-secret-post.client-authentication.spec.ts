import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary, OneOrMany } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthentication } from './client-authentication.type';
import { ClientSecretPostClientAuthentication } from './client-secret-post.client-authentication';
import { ClientSecretPostClientAuthenticationParameters } from './client-secret-post.client-authentication.parameters';

jest.mock('../logger/logger');

const methodRequests: [Dictionary<OneOrMany<string>>, boolean][] = [
  [{}, false],
  [{ client_id: '' }, false],
  [{ client_id: 'foo' }, false],
  [{ client_secret: '' }, false],
  [{ client_secret: 'bar' }, false],
  [{ client_id: '', client_secret: '' }, true],
  [{ client_id: 'foo', client_secret: '' }, true],
  [{ client_id: '', client_secret: 'bar' }, true],
  [{ client_id: 'foo', client_secret: 'bar' }, true],
];

describe('Client Secret Post Authentication Method', () => {
  let container: DependencyInjectionContainer;
  let clientAuthentication: ClientSecretPostClientAuthentication;

  const loggerMock = jest.mocked(Logger.prototype);

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(ClientSecretPostClientAuthentication).toSelf().asSingleton();

    clientAuthentication = container.resolve(ClientSecretPostClientAuthentication);
  });

  describe('name', () => {
    it('should have "client_secret_post" as its name.', () => {
      expect(clientAuthentication.name).toEqual<ClientAuthentication>('client_secret_post');
    });
  });

  describe('hasBeenRequested()', () => {
    it.each(methodRequests)('should check if the authentication method has beed requested.', (body, expected) => {
      const request = new HttpRequest({
        body,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });

      expect(clientAuthentication.hasBeenRequested(request)).toEqual(expected);
    });
  });

  describe('authenticate()', () => {
    let parameters: ClientSecretPostClientAuthenticationParameters;

    const requestFactory = (data: Partial<ClientSecretPostClientAuthenticationParameters> = {}): HttpRequest => {
      removeNullishValues<ClientSecretPostClientAuthenticationParameters>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = { client_id: 'client_id', client_secret: 'client_secret' };
    });

    it('should throw when a client is not found.', async () => {
      const request = requestFactory();

      clientServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid Credentials.',
      );
    });

    it('should throw when a client does not have a secret.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        secret: null,
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "client_secret_post".',
      );
    });

    it("should throw when the provided secret does not match the client's one.", async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        secret: 'invalid_secret',
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid Credentials.',
      );
    });

    it('should throw when requesting with a client with an expired secret.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        secret: 'client_secret',
        secretExpiresAt: new Date(Date.now() - 3600000),
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid Credentials.',
      );
    });

    it('should throw when requesting with a client not authorized to use this authentication method.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        secret: 'client_secret',
        authenticationMethod: 'unknown' as ClientAuthentication,
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "client_secret_post".',
      );
    });

    it('should return an instance of a client.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        secret: 'client_secret',
        authenticationMethod: 'client_secret_post',
      });

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).resolves.toBe(client);
    });
  });
});
