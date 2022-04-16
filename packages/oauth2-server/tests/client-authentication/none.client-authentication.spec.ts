import { Dict } from '@guarani/types';

import { URL } from 'url';

import { NoneClientAuthentication } from '../../lib/client-authentication/none.client-authentication';
import { SupportedClientAuthentication } from '../../lib/client-authentication/types/supported-client-authentication';
import { ClientEntity } from '../../lib/entities/client.entity';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { Request } from '../../lib/http/request';
import { ClientService } from '../../lib/services/client.service';

const clients: ClientEntity[] = [
  {
    id: 'client_id',
    redirectUris: [new URL('https://example.com/callback')],
    authenticationMethod: 'none',
    grantTypes: ['authorization_code'],
    responseTypes: ['code'],
    scopes: ['scope1', 'scope2'],
  },
  {
    id: 'id_client',
    secret: 'secret_client',
    redirectUris: [new URL('https://example.com/callback')],
    authenticationMethod: 'client_secret_basic',
    grantTypes: ['authorization_code'],
    responseTypes: ['code'],
    scopes: ['scope1', 'scope2'],
  },
  {
    id: 'foobar',
    redirectUris: [new URL('https://example.com/callback')],
    authenticationMethod: 'client_secret_post',
    grantTypes: ['authorization_code'],
    responseTypes: ['code'],
    scopes: ['scope1', 'scope2'],
  },
];

const clientServiceMock: jest.Mocked<ClientService> = {
  findClient: jest.fn().mockImplementation(async (clientId: string) => {
    return clients.find((client) => client.id === clientId);
  }),
};

const method = new NoneClientAuthentication(clientServiceMock);

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

describe('None Client Authentication Method', () => {
  describe('name', () => {
    it('should have "none" as its name.', () => {
      expect(method.name).toBe<SupportedClientAuthentication>('none');
    });
  });

  describe('hasBeenRequested()', () => {
    it.each(methodRequests)('should check if the Authentication Method has beed requested.', (body, expected) => {
      const request = new Request({ body, headers: {}, method: 'post', query: {} });
      expect(method.hasBeenRequested(request)).toBe(expected);
    });
  });

  describe('authenticate()', () => {
    const request = new Request({ body: {}, headers: {}, method: 'post', query: {} });

    beforeEach(() => {
      Reflect.set(request, 'body', {});
    });

    it('should reject when a Client is not found.', async () => {
      Object.assign(request.body, { client_id: 'unknown_client' });
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a Client with a Secret.', async () => {
      Object.assign(request.body, { client_id: 'id_client' });
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a Client not authorized to use this Authentication Method.', async () => {
      Object.assign(request.body, { client_id: 'foobar' });
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should return an instance of a Client Entity.', async () => {
      Object.assign(request.body, { client_id: 'client_id' });
      await expect(method.authenticate(request)).resolves.toMatchObject(clients[0]);
    });
  });
});
