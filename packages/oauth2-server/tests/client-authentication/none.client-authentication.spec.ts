import { Dict, Optional } from '@guarani/types';

import { NoneClientAuthentication } from '../../lib/client-authentication/none.client-authentication';
import { Client } from '../../lib/entities/client';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { HttpRequest } from '../../lib/http/http.request';
import { IClientService } from '../../lib/services/client.service.interface';
import { ClientAuthentication } from '../../lib/types/client-authentication';

const clients = <Client[]>[
  {
    id: 'client_id',
    authenticationMethod: 'none',
  },
  {
    id: 'id_client',
    secret: 'secret_client',
    authenticationMethod: 'client_secret_basic',
  },
  {
    id: 'invalid_client',
    authenticationMethod: 'client_secret_basic',
  },
];

const clientServiceMock: jest.Mocked<Partial<IClientService>> = {
  findClient: jest.fn(async (clientId: string): Promise<Optional<Client>> => {
    return clients.find((client) => client.id === clientId);
  }),
};

const method = new NoneClientAuthentication(<IClientService>clientServiceMock);

describe('None Client Authentication Method', () => {
  describe('name', () => {
    it('should have "none" as its name.', () => {
      expect(method.name).toBe<ClientAuthentication>('none');
    });
  });

  describe('hasBeenRequested()', () => {
    const methodRequests: [Dict, boolean][] = [
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
      const request = new HttpRequest({ body, headers: {}, method: 'post', query: {} });
      expect(method.hasBeenRequested(request)).toBe(expected);
    });
  });

  describe('authenticate()', () => {
    const request = new HttpRequest({ body: {}, headers: {}, method: 'post', query: {} });

    beforeEach(() => {
      Reflect.set(request, 'body', {});
    });

    it('should reject when a client is not found.', async () => {
      Object.assign(request.body, { client_id: 'unknown_client', client_secret: 'unknown_secret' });
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a client with a secret.', async () => {
      Object.assign(request.body, { client_id: 'id_client' });
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a client not authorized to use this authentication method.', async () => {
      Object.assign(request.body, { client_id: 'invalid_client' });
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should return an instance of a client.', async () => {
      Object.assign(request.body, { client_id: 'client_id' });
      await expect(method.authenticate(request)).resolves.toBe(clients[0]);
    });
  });
});
