import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthentication } from './client-authentication.type';
import {
  ClientSecretPostClientAuthentication,
  ClientSecretPostCredentials,
} from './client-secret-post.client-authentication';

describe('Client Secret Post Authentication Method', () => {
  let container: DependencyInjectionContainer;
  let clientAuthentication: ClientSecretPostClientAuthentication;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

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
    const methodRequests: [Dictionary<unknown>, boolean][] = [
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

    it.each(methodRequests)('should check if the authentication method has beed requested.', (body, expected) => {
      const request = new HttpRequest({
        body,
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      });

      expect(clientAuthentication.hasBeenRequested(request)).toEqual(expected);
    });
  });

  describe('authenticate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <ClientSecretPostCredentials>{
          client_id: 'client_id',
          client_secret: 'client_secret',
        },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      });
    });

    it('should throw when a client is not found.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid Credentials.'
      );
    });

    it('should throw when a client does not have a secret.', async () => {
      const client = <Client>{ id: 'client_id', secret: null };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "client_secret_post".'
      );
    });

    it("should throw when the provided secret does not match the client's one.", async () => {
      const client = <Client>{ id: 'client_id', secret: 'invalid_secret' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid Credentials.'
      );
    });

    it('should throw when requesting with a client with an expired secret.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'client_secret',
        secretExpiresAt: new Date(Date.now() - 3600000),
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'Invalid Credentials.'
      );
    });

    it('should throw when requesting with a client not authorized to use this authentication Method.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'client_secret',
        authenticationMethod: 'unknown' as ClientAuthentication,
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "client_secret_post".'
      );
    });

    it('should return an instance of a client.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'client_secret',
        authenticationMethod: 'client_secret_post',
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).resolves.toBe(client);
    });
  });
});
