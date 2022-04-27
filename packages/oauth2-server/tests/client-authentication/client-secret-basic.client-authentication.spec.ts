import { Optional } from '@guarani/types';

import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';

import { ClientSecretBasicClientAuthentication } from '../../lib/client-authentication/client-secret-basic.client-authentication';
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
    authenticationMethod: 'client_secret_basic',
  },
  {
    id: 'expired_id',
    secret: 'expired_secret',
    secretExpiresAt: new Date(Date.now() - 3600000),
    authenticationMethod: 'client_secret_basic',
  },
  {
    id: 'id_client',
    secret: 'secret_client',
    authenticationMethod: 'client_secret_post',
  },
  {
    id: 'invalid_client',
    authenticationMethod: 'client_secret_basic',
  },
];

const clientServiceMock: jest.Mocked<Partial<IClientService>> = {
  findClient: jest.fn().mockImplementation(async (clientId: string): Promise<Optional<Client>> => {
    return clients.find((client) => client.id === clientId);
  }),
};

const method = new ClientSecretBasicClientAuthentication(<IClientService>clientServiceMock);

describe('Client Secret Basic Authentication Method', () => {
  describe('name', () => {
    it('should have "client_secret_basic" as its name.', () => {
      expect(method.name).toBe<ClientAuthentication>('client_secret_basic');
    });
  });

  describe('headers', () => {
    it('should have a "WWW-Authenticate" header.', () => {
      expect(method['headers']).toMatchObject<OutgoingHttpHeaders>({ 'WWW-Authenticate': 'Basic' });
    });
  });

  describe('hasBeenRequested()', () => {
    const methodRequests: [IncomingHttpHeaders, boolean][] = [
      [{}, false],
      [{ authorization: '' }, false],
      [{ authorization: 'Bearer' }, false],
      [{ authorization: 'Basic' }, true],
      [{ authorization: 'Basic ' }, true],
      [{ authorization: 'Basic $' }, true],
      [{ authorization: 'Basic 123abcDEF+/=' }, true],
    ];

    it.each(methodRequests)('should check if the authentication method has beed requested.', (headers, expected) => {
      const request = new HttpRequest({ body: {}, headers, method: 'post', query: {} });
      expect(method.hasBeenRequested(request)).toBe(expected);
    });
  });

  describe('authenticate()', () => {
    const request = new HttpRequest({ body: {}, headers: {}, method: 'post', query: {} });

    beforeEach(() => {
      delete request.headers.authorization;
    });

    it('should reject an authorization header without a token.', async () => {
      request.headers.authorization = 'Basic';
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a token that is not base64 encoded.', async () => {
      request.headers.authorization = 'Basic $';
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a token that does not contain a semicolon.', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('foobar', 'utf8').toString('base64');
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it.each([':', ':secret'])('should reject a token with an empty "client_id".', async (credentials) => {
      request.headers.authorization = 'Basic ' + Buffer.from(credentials, 'utf8').toString('base64');
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a token with an empty "client_secret".', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('id:', 'utf8').toString('base64');
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject when a client is not found.', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('unknown_id:unknown_secret', 'utf8').toString('base64');
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject when a client does not have a secret.', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('invalid_client:client_secret', 'utf8').toString('base64');
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it.each(['secret_client', 'unknown'])(
      "should reject when the provided secret does not match the client's one.",
      async (secret) => {
        request.headers.authorization = 'Basic ' + Buffer.from(`client_id:${secret}`, 'utf8').toString('base64');
        await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
      }
    );

    it('should reject a client with an expired secret.', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('expired_id:expired_secret', 'utf8').toString('base64');
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a client not authorized to use this authentication method.', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('id_client:secret_client', 'utf8').toString('base64');
      await expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should return an instance of a client.', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('client_id:client_secret', 'utf8').toString('base64');
      await expect(method.authenticate(request)).resolves.toBe(clients[0]);
    });
  });
});
