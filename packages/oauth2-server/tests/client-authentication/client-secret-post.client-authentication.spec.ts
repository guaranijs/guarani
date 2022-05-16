import { Dict, Optional } from '@guarani/types';

import { ClientSecretPostClientAuthentication } from '../../lib/client-authentication/client-secret-post.client-authentication';
import { Client } from '../../lib/entities/client';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { HttpRequest } from '../../lib/http/http.request';
import { IClientService } from '../../lib/services/client.service.interface';
import { ClientAuthentication } from '../../lib/types/client-authentication';

const clients = <Client[]>[
  {
    id: 'client_id',
    secret: 'client_secret',
    secretExpiresAt: new Date(Date.now() + 86400000),
    authenticationMethod: 'client_secret_post',
  },
  {
    id: 'expired_id',
    secret: 'expired_secret',
    secretExpiresAt: new Date(Date.now() - 3600000),
    authenticationMethod: 'client_secret_post',
  },
  {
    id: 'id_client',
    secret: 'secret_client',
    authenticationMethod: 'client_secret_basic',
  },
  {
    id: 'invalid_client',
    authenticationMethod: 'client_secret_post',
  },
];

const clientServiceMock: jest.Mocked<Partial<IClientService>> = {
  findClient: jest.fn().mockImplementation(async (clientId: string): Promise<Optional<Client>> => {
    return <Client>clients.find((client) => client.id! === clientId);
  }),
};

const method = new ClientSecretPostClientAuthentication(<IClientService>clientServiceMock);

describe('Client Secret Post Authentication Method', () => {
  describe('name', () => {
    it('should have "client_secret_post" as its name.', () => {
      expect(method.name).toBe<ClientAuthentication>('client_secret_post');
    });
  });

  describe('hasBeenRequested()', () => {
    const methodRequests: [Dict, boolean][] = [
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

    it('should reject when a client does not have a secret.', async () => {
      Object.assign(request.body, { client_id: 'invalid_client', client_secret: 'client_secret' });
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it.each(['secret_client', 'unknown'])(
      "should reject when the provided secret does not match the client's one.",
      async (secret) => {
        Object.assign(request.body, { client_id: 'client_id', client_secret: secret });
        await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
      }
    );

    it('should reject a client with an expired secret.', async () => {
      Object.assign(request.body, { client_id: 'expired_id', client_secret: 'expired_secret' });
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a client not authorized to use this authentication Method.', async () => {
      Object.assign(request.body, { client_id: 'id_client', client_secret: 'secret_client' });
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should return an instance of a client.', async () => {
      Object.assign(request.body, { client_id: 'client_id', client_secret: 'client_secret' });
      await expect(method.authenticate(request)).resolves.toBe(clients[0]);
    });
  });
});
