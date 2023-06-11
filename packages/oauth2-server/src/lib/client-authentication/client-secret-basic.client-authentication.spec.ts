import { Buffer } from 'buffer';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthentication } from './client-authentication.type';
import { ClientSecretBasicClientAuthentication } from './client-secret-basic.client-authentication';

describe('Client Secret Basic Authentication Method', () => {
  let container: DependencyInjectionContainer;
  let clientAuthentication: ClientSecretBasicClientAuthentication;

  const clientServiceMock = jest.mocked<ClientServiceInterface>({
    findOne: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<ClientServiceInterface>(CLIENT_SERVICE).toValue(clientServiceMock);
    container.bind(ClientSecretBasicClientAuthentication).toSelf().asSingleton();

    clientAuthentication = container.resolve(ClientSecretBasicClientAuthentication);
  });

  describe('name', () => {
    it('should have "client_secret_basic" as its name.', () => {
      expect(clientAuthentication.name).toEqual<ClientAuthentication>('client_secret_basic');
    });
  });

  describe('headers', () => {
    it('should have a "WWW-Authenticate" header.', () => {
      expect(clientAuthentication['headers']).toStrictEqual<OutgoingHttpHeaders>({ 'WWW-Authenticate': 'Basic' });
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
      const request = new HttpRequest({
        body: Buffer.alloc(0),
        cookies: {},
        headers,
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });

      expect(clientAuthentication.hasBeenRequested(request)).toEqual(expected);
    });
  });

  describe('authenticate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: Buffer.alloc(0),
        cookies: {},
        headers: { authorization: 'Basic ' + Buffer.from('client_id:client_secret', 'utf8').toString('base64') },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    });

    it('should throw when providing an authorization header without a token.', async () => {
      request.headers.authorization = 'Basic';

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException('Missing Token.').setHeaders(clientAuthentication['headers'])
      );
    });

    it('should throw when providing a token that is not base64 encoded.', async () => {
      request.headers.authorization = 'Basic $';

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException('Token is not a Base64 string.').setHeaders(clientAuthentication['headers'])
      );
    });

    it('should throw when providing a token that does not contain a semicolon.', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('foobar', 'utf8').toString('base64');

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException('Missing Semicolon Separator.').setHeaders(clientAuthentication['headers'])
      );
    });

    it.each([':', ':secret'])('should throw when providing a token with an empty "client_id".', async (credentials) => {
      request.headers.authorization = 'Basic ' + Buffer.from(credentials, 'utf8').toString('base64');

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException('Missing Client Identifier.').setHeaders(clientAuthentication['headers'])
      );
    });

    it('should throw when providing a token with an empty "client_secret".', async () => {
      request.headers.authorization = 'Basic ' + Buffer.from('id:', 'utf8').toString('base64');

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException('Missing Client Secret.').setHeaders(clientAuthentication['headers'])
      );
    });

    it('should throw when a client is not found.', async () => {
      clientServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException('Invalid Credentials.').setHeaders(clientAuthentication['headers'])
      );
    });

    it('should throw when a client does not have a secret.', async () => {
      const client = <Client>{ id: 'client_id', secret: null };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException(
          'This Client is not allowed to use the Authentication Method "client_secret_basic".'
        ).setHeaders(clientAuthentication['headers'])
      );
    });

    it("should throw when the provided secret does not match the client's one.", async () => {
      const client = <Client>{ id: 'client_id', secret: 'invalid_secret' };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException('Invalid Credentials.').setHeaders(clientAuthentication['headers'])
      );
    });

    it('should throw when requesting with a client with an expired secret.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'client_secret',
        secretExpiresAt: new Date(Date.now() - 3600000),
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException('Invalid Credentials.').setHeaders(clientAuthentication['headers'])
      );
    });

    it('should throw when requesting with a client not authorized to use this authentication method.', async () => {
      const client = <Client>{
        id: 'client_id',
        secret: 'client_secret',
        authenticationMethod: 'unknown' as ClientAuthentication,
      };

      clientServiceMock.findOne.mockResolvedValueOnce(client);

      await expect(clientAuthentication.authenticate(request)).rejects.toThrow(
        new InvalidClientException(
          'This Client is not allowed to use the Authentication Method "client_secret_basic".'
        ).setHeaders(clientAuthentication['headers'])
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
