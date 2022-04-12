import { Dict, Optional } from '@guarani/types';

import { URL } from 'url';

import { ClientSecretPostClientAuthentication } from '../../lib/client-authentication/client-secret-post.client-authentication';
import { SupportedClientAuthentication } from '../../lib/client-authentication/types/supported-client-authentication';
import { ClientEntity } from '../../lib/entities/client.entity';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { Request } from '../../lib/http/request';
import { ClientService } from '../../lib/services/client.service';

const clientSecretPost = <ClientEntity>{
  id: 'client_id',
  secret: 'client_secret',
  redirectUris: [new URL('https://example.com/callback')],
  authenticationMethod: 'client_secret_post',
  grantTypes: ['authorization_code'],
  responseTypes: ['code'],
  scopes: ['scope1', 'scope2'],
};

const clientSecretBasic = <ClientEntity>{
  id: 'id_client',
  secret: 'secret_client',
  redirectUris: [new URL('https://example.com/callback')],
  authenticationMethod: 'client_secret_basic',
  grantTypes: ['authorization_code'],
  responseTypes: ['code'],
  scopes: ['scope1', 'scope2'],
};

const clientNone = <ClientEntity>{
  id: 'foobar',
  redirectUris: [new URL('https://example.com/callback')],
  authenticationMethod: 'none',
  grantTypes: ['authorization_code'],
  responseTypes: ['code'],
  scopes: ['scope1', 'scope2'],
};

const clientServiceMock = <ClientService>{
  findClient: async (clientId: string): Promise<Optional<ClientEntity>> => {
    return [clientSecretPost, clientSecretBasic, clientNone].find((client) => client.id === clientId);
  },
};

const method = new ClientSecretPostClientAuthentication(clientServiceMock);

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

const mismatchingCredentials: Dict[] = [
  { client_id: 'client_id', client_secret: 'unknown_secret' },
  { client_id: 'client_id', client_secret: 'client-secret' },
];

describe('Client Secret Post Authentication Method', () => {
  describe('name', () => {
    it('should have "client_secret_post" as its name.', () => {
      expect(method.name).toBe<SupportedClientAuthentication>('client_secret_post');
    });
  });

  describe('hasBeenRequested()', () => {
    it.each(methodRequests)('should check if the Authentication Method has beed requested.', (body, expected) => {
      const request = new Request({ body, headers: {}, method: 'post', query: {} });
      expect(method.hasBeenRequested(request)).toBe(expected);
    });
  });

  describe('authenticate()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'post', query: {} });
    });

    it('should reject when a Client is not found.', () => {
      Reflect.set(request, 'body', { client_id: 'unknown_client', client_secret: 'unknown_secret' });
      expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a Client without a Secret.', () => {
      Reflect.set(request, 'body', { client_id: 'foobar', client_secret: 'barfoo' });
      expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it.each(mismatchingCredentials)(
      "should reject when the provided Client Secret does not match the Client's one.",
      (credentials) => {
        Reflect.set(request, 'body', credentials);
        expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
      }
    );

    it('should reject a Client not authorized to use this Authentication Method.', () => {
      Reflect.set(request, 'body', { client_id: 'id_client', client_secret: 'secret_client' });
      expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should return an instance of a Client Entity.', () => {
      Reflect.set(request, 'body', { client_id: 'client_id', client_secret: 'client_secret' });
      expect(method.authenticate(request)).resolves.toMatchObject(clientSecretPost);
    });
  });
});
