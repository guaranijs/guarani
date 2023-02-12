import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientSecretBasicClientAuthentication } from './client-secret-basic.client-authentication';

describe('Client Secret Basic Authentication Method', () => {
  let clientAuthentication: ClientSecretBasicClientAuthentication;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(ClientSecretBasicClientAuthentication).toSelf().asSingleton();

    clientAuthentication = container.resolve(ClientSecretBasicClientAuthentication);
  });

  describe('name', () => {
    it('should have "client_secret_basic" as its name.', () => {
      expect(clientAuthentication.name).toBe('client_secret_basic');
    });
  });

  describe('headers', () => {
    it('should have a "WWW-Authenticate" header.', () => {
      expect(clientAuthentication['headers']).toMatchObject<OutgoingHttpHeaders>({ 'WWW-Authenticate': 'Basic' });
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
      const request: HttpRequest = { body: {}, cookies: {}, headers, method: 'POST', path: '/oauth/token', query: {} };

      expect(clientAuthentication.hasBeenRequested(request)).toBe(expected);
    });
  });

  describe('authenticate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = {
        body: {},
        cookies: {},
        headers: { authorization: 'Basic ' + Buffer.from('client_id:client_secret', 'utf8').toString('base64') },
        method: 'POST',
        path: '/oauth/token',
        query: {},
      };
    });

    it('should reject an authorization header without a token.', async () => {
      request.headers.authorization = 'Basic';

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Missing Token.' }).setHeaders(clientAuthentication['headers'])
      );
    });

    it('should reject a token that is not base64 encoded.', async () => {
      request.headers.authorization = 'Basic $';

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Token is not a Base64 string.' }).setHeaders(
          clientAuthentication['headers']
        )
      );
    });

    it('should reject a token that does not contain a semicolon.', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('foobar', 'utf8').toString('base64');

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Missing Semicolon Separator.' }).setHeaders(
          clientAuthentication['headers']
        )
      );
    });

    it.each([':', ':secret'])('should reject a token with an empty "client_id".', async (credentials) => {
      request.headers.authorization = 'Basic ' + Buffer.from(credentials, 'utf8').toString('base64');

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Missing Client Identifier.' }).setHeaders(
          clientAuthentication['headers']
        )
      );
    });

    it('should reject a token with an empty "client_secret".', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('id:', 'utf8').toString('base64');

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Missing Client Secret.' }).setHeaders(
          clientAuthentication['headers']
        )
      );
    });

    it('should reject when a client is not found.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders(clientAuthentication['headers'])
      );
    });

    it('should reject when a client does not have a secret.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{ id: 'client_id' });

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "client_secret_basic".',
        }).setHeaders(clientAuthentication['headers'])
      );
    });

    it("should reject when the provided secret does not match the client's one.", async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{ id: 'client_id', secret: 'invalid_secret' });

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders(clientAuthentication['headers'])
      );
    });

    it('should reject a client with an expired secret.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        secret: 'client_secret',
        secretExpiresAt: new Date(Date.now() - 3600000),
      });

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders(clientAuthentication['headers'])
      );
    });

    it('should reject a client not authorized to use this authentication method.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(<Client>{
        id: 'client_id',
        secret: 'client_secret',
        authenticationMethod: <any>'unknown',
      });

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException({
          description: 'This Client is not allowed to use the Authentication Method "client_secret_basic".',
        }).setHeaders(clientAuthentication['headers'])
      );
    });

    it('should return an instance of a client.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'client_secret',
        authenticationMethod: 'client_secret_basic',
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).resolves.toBe(client);
    });
  });
});
