import { Attributes } from '@guarani/types';

import { OutgoingHttpHeaders } from 'http';

import { ClientAuthenticator } from '../../lib/client-authentication/client-authenticator';
import { TokenEndpoint } from '../../lib/endpoints/token.endpoint';
import { Client } from '../../lib/entities/client';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { UnauthorizedClientException } from '../../lib/exceptions/unauthorized-client.exception';
import { UnsupportedGrantTypeException } from '../../lib/exceptions/unsupported-grant-type.exception';
import { IGrantType } from '../../lib/grant-types/grant-type.interface';
import { HttpRequest } from '../../lib/http/http.request';
import { HttpResponse } from '../../lib/http/http.response';
import { TokenResponse } from '../../lib/models/token-response';
import { Endpoint } from '../../lib/types/endpoint';
import { HttpMethod } from '../../lib/types/http-method';

jest.mock('../../lib/client-authentication/client-authenticator');

const clients = <Client[]>[
  {
    id: 'client_id',
    grantTypes: ['authorization_code'],
    scopes: ['foo', 'bar', 'baz'],
  },
  {
    id: 'id_client',
    grantTypes: ['password'],
    scopes: ['foo', 'bar', 'baz'],
  },
];

const clientAuthenticatorMock = jest.mocked(ClientAuthenticator.prototype, true);

const grantTypesMock: jest.Mocked<IGrantType>[] = [
  { name: 'authorization_code', handle: jest.fn() },
  { name: 'client_credentials', handle: jest.fn() },
];

const endpoint = new TokenEndpoint(clientAuthenticatorMock, grantTypesMock);

describe('Token Endpoint', () => {
  describe('name', () => {
    it('should have "token" as its name.', () => {
      expect(endpoint.name).toBe<Endpoint>('token');
    });
  });

  describe('path', () => {
    it('should have "/oauth/token" as its default path.', () => {
      expect(endpoint.path).toBe('/oauth/token');
    });
  });

  describe('methods', () => {
    it('should have "[\'post\']" as its methods.', () => {
      expect(endpoint.methods).toStrictEqual<HttpMethod[]>(['post']);
    });
  });

  describe('headers', () => {
    it('should have a default "headers" object for the http Response.', () => {
      expect(endpoint['headers']).toMatchObject<OutgoingHttpHeaders>({
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      });
    });
  });

  describe('handle()', () => {
    const request = new HttpRequest({ body: {}, headers: {}, method: 'post', query: {} });

    beforeEach(() => {
      Reflect.set(request, 'body', { grant_type: 'authorization_code' });

      clientAuthenticatorMock.authenticate.mockRestore();
    });

    it('should reject not providing a "grant_type" parameter.', async () => {
      delete request.body.grant_type;

      const error = new InvalidRequestException('Invalid parameter "grant_type".');

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: endpoint['headers'],
        statusCode: error.statusCode,
      });
    });

    it('should reject requesting an unsupported grant type.', async () => {
      request.body.grant_type = 'unknown';

      const error = new UnsupportedGrantTypeException('Unsupported grant_type "unknown".');

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: endpoint['headers'],
        statusCode: error.statusCode,
      });
    });

    it('should reject not using a client authentication method.', async () => {
      const error = new InvalidClientException('No Client Authentication Method detected.');

      clientAuthenticatorMock.authenticate.mockRejectedValue(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: endpoint['headers'],
        statusCode: error.statusCode,
      });
    });

    it('should reject using multiple client authentication methods.', async () => {
      const error = new InvalidClientException('Multiple Client Authentication Methods detected.');

      clientAuthenticatorMock.authenticate.mockRejectedValue(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: endpoint['headers'],
        statusCode: error.statusCode,
      });
    });

    it("should reject when the provided secret does not match the client's one.", async () => {
      const error = new InvalidClientException('Invalid Credentials.').setHeaders({
        'WWW-Authenticate': 'Basic',
      });

      clientAuthenticatorMock.authenticate.mockRejectedValue(error);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: { ...endpoint['headers'], ...error.headers },
        statusCode: error.statusCode,
      });
    });

    it('should reject when a client requests a grant type not allowed to itself.', async () => {
      const error = new UnauthorizedClientException(
        'This Client is not allowed to request the grant_type "authorization_code".'
      );

      clientAuthenticatorMock.authenticate.mockResolvedValue(clients[1]);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(error.toJSON()), 'utf8'),
        headers: endpoint['headers'],
        statusCode: error.statusCode,
      });
    });

    it('should return a token response.', async () => {
      const accessTokenResponse: TokenResponse = {
        access_token: 'access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'foo bar',
        refresh_token: 'refresh_token',
      };

      clientAuthenticatorMock.authenticate.mockResolvedValue(clients[0]);
      grantTypesMock[0].handle.mockResolvedValue(accessTokenResponse);

      await expect(endpoint.handle(request)).resolves.toMatchObject<Attributes<HttpResponse>>({
        body: Buffer.from(JSON.stringify(accessTokenResponse), 'utf8'),
        headers: { 'Content-Type': 'application/json', ...endpoint['headers'] },
        statusCode: 200,
      });
    });
  });
});
