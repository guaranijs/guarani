import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { NoneClientAuthentication } from './none.client-authentication';

describe('None Client Authentication Method', () => {
  let clientAuthentication: NoneClientAuthentication;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(NoneClientAuthentication).toSelf().asSingleton();

    clientAuthentication = container.resolve(NoneClientAuthentication);
  });

  describe('name', () => {
    it('should have "none" as its name.', () => {
      expect(clientAuthentication.name).toBe('none');
    });
  });

  describe('hasBeenRequested()', () => {
    const methodRequests: [Record<string, any>, boolean][] = [
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
      const request: HttpRequest = { body, cookies: {}, headers: {}, method: 'POST', path: '/oauth/token', query: {} };

      expect(clientAuthentication.hasBeenRequested(request)).toBe(expected);
    });
  });

  describe('authenticate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = {
        body: { client_id: 'client_id' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      };
    });

    it('should reject when a client is not found.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Invalid Credentials.' })
      );
    });

    it('should reject a client with a secret.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{ id: 'client_id', secret: 'client_secret' });

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "none".',
        })
      );
    });

    it('should reject a client not authorized to use this authentication method.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        authenticationMethod: <any>'unknown',
      });

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "none".',
        })
      );
    });

    it('should return an instance of a client.', async () => {
      const client = <Client>{ id: 'client_id', authenticationMethod: 'none' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).resolves.toBe(client);
    });
  });
});
