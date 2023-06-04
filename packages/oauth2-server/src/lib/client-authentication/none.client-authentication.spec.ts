import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthentication } from './client-authentication.type';
import { NoneClientAuthentication, NoneCredentials } from './none.client-authentication';

describe('None Client Authentication Method', () => {
  let container: DependencyInjectionContainer;
  let clientAuthentication: NoneClientAuthentication;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(NoneClientAuthentication).toSelf().asSingleton();

    clientAuthentication = container.resolve(NoneClientAuthentication);
  });

  describe('name', () => {
    it('should have "none" as its name.', () => {
      expect(clientAuthentication.name).toEqual<ClientAuthentication>('none');
    });
  });

  describe('hasBeenRequested()', () => {
    const methodRequests: [Dictionary<unknown>, boolean][] = [
      [{}, false],
      [{ client_id: '' }, true],
      [{ client_id: 'foo' }, true],
      [{ client_secret: '' }, false],
      [{ client_secret: 'bar' }, false],
      [{ client_id: '', client_secret: '' }, false],
      [{ client_id: 'foo', client_secret: '' }, false],
      [{ client_id: '', client_secret: 'bar' }, false],
      [{ client_id: 'foo', client_secret: 'bar' }, false],
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
        body: <NoneCredentials>{ client_id: 'client_id' },
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

    it('should throw when requesting with a client with a secret.', async () => {
      const client = <Client>{ id: 'client_id', secret: 'client_secret' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "none".'
      );
    });

    it('should throw when requesting with a client not authorized to use this authentication method.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: null,
        authenticationMethod: 'unknown' as ClientAuthentication,
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrowWithMessage(
        InvalidClientException,
        'This Client is not allowed to use the Authentication Method "none".'
      );
    });

    it('should return an instance of a client.', async () => {
      const client = <Client>{ id: 'client_id', secret: null, authenticationMethod: 'none' };
      clientServiceMock.findOne.mockResolvedValueOnce(client);
      await expect(clientAuthentication.authenticate(request)).resolves.toBe(client);
    });
  });
});
