import { OutgoingHttpHeaders } from 'http';

import { ClientAuthentication } from '../../lib/client-authentication/client-authentication';
import { SupportedEndpoint } from '../../lib/endpoints/types/supported-endpoint';
import { ClientEntity } from '../../lib/entities/client.entity';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../lib/exceptions/invalid-request.exception';
import { GrantType } from '../../lib/grant-types/grant-type';
import { Request } from '../../lib/http/request';
import { Response } from '../../lib/http/response';
import { RevocationEndpointMock } from './mocks/revocation.endpoint.mock';

const client: ClientEntity = {
  id: 'client1',
  secret: 'secret1',
  redirectUris: ['https://client1.example.com/callback'],
  authenticationMethod: 'client_secret_basic',
  grantTypes: ['authorization_code'],
  responseTypes: ['code'],
  scopes: ['foo', 'bar', 'baz'],
};

const grantTypes: jest.Mocked<GrantType>[] = [
  { name: 'authorization_code', createTokenResponse: jest.fn() },
  { name: 'refresh_token', createTokenResponse: jest.fn() },
];

const clientAuthenticationMethodsMock: jest.Mocked<ClientAuthentication>[] = [
  { name: 'client_secret_basic', hasBeenRequested: jest.fn(), authenticate: jest.fn() },
  { name: 'client_secret_post', hasBeenRequested: jest.fn(), authenticate: jest.fn() },
];

const endpoint = new RevocationEndpointMock(grantTypes, clientAuthenticationMethodsMock);

describe('Revocation Endpoint', () => {
  describe('constructor', () => {
    it('should reject when the Authorization Server does not support Refresh Tokens.', () => {
      expect(() => new RevocationEndpointMock([], [])).toThrow(Error);
    });
  });

  describe('name', () => {
    it('should have "revocation" as its name.', () => {
      expect(endpoint.name).toBe<SupportedEndpoint>('revocation');
    });
  });

  describe('headers', () => {
    it('should have a default headers object for the HTTP Response.', () => {
      // @ts-expect-error Testing a protected attribute.
      expect(endpoint.headers).toMatchObject<OutgoingHttpHeaders>({ 'Cache-Control': 'no-store', Pragma: 'no-cache' });
    });
  });

  describe('checkParameters()', () => {
    it('should reject not providing a "token" parameter.', () => {
      // @ts-expect-error Testing a protected method.
      expect(() => endpoint.checkParameters({})).toThrow(InvalidRequestException);
    });

    it('should reject when providing an unsupported "token_type_hint".', () => {
      // @ts-expect-error Testing a protected method; unsupported token type hint.
      expect(() => endpoint.checkParameters({ token: 'refresh_token', token_type_hint: 'unknown' })).toThrow(
        InvalidRequestException
      );
    });

    it('should not reject when providing a valid parameters object.', () => {
      // @ts-expect-error Testing a protected method.
      expect(() => endpoint.checkParameters({ token: 'refresh_token' })).not.toThrow();
    });
  });

  describe('authenticateClient()', () => {
    const request = new Request({ body: {}, headers: {}, method: 'post', query: {} });

    afterEach(() => {
      clientAuthenticationMethodsMock.forEach((method) => {
        method.hasBeenRequested.mockReset();
        method.authenticate.mockReset();
      });
    });

    it('should reject not using a Client Authentication Method.', async () => {
      clientAuthenticationMethodsMock.forEach((method) => method.hasBeenRequested.mockReturnValue(false));

      // @ts-expect-error Testing a private method.
      await expect(endpoint.authenticateClient(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject using multiple Client Authentication Methods.', async () => {
      clientAuthenticationMethodsMock.forEach((method) => method.hasBeenRequested.mockReturnValue(true));

      // @ts-expect-error Testing a private method.
      await expect(endpoint.authenticateClient(request)).rejects.toThrow(InvalidClientException);
    });

    it('should return an authenticated Client.', async () => {
      clientAuthenticationMethodsMock[0].hasBeenRequested.mockReturnValue(true);
      clientAuthenticationMethodsMock[0].authenticate.mockResolvedValue(client);

      // @ts-expect-error Testing a private method.
      await expect(endpoint.authenticateClient(request)).resolves.toMatchObject(client);
    });
  });

  describe('handle()', () => {
    const request = new Request({ body: {}, headers: {}, method: 'post', query: {} });

    beforeEach(() => {
      Reflect.set(request, 'body', {});
    });

    it('should return an error response when not providing a "token" parameter.', async () => {
      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<Response>>({
        body: Buffer.from(
          JSON.stringify({ error: 'invalid_request', error_description: 'Invalid parameter "token".' }),
          'utf8'
        ),
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        statusCode: 400,
      });
    });

    it('should return an error response when providing an unsupported "token_type_hint".', async () => {
      Object.assign(request.body, { token: 'token', token_type_hint: 'unknown' });

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<Response>>({
        body: Buffer.from(
          JSON.stringify({ error: 'invalid_request', error_description: 'Invalid parameter "token_type_hint".' }),
          'utf8'
        ),
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        statusCode: 400,
      });
    });

    it('should return an error response when the Client Authentication fails.', async () => {
      clientAuthenticationMethodsMock[0].hasBeenRequested.mockReturnValue(true);
      clientAuthenticationMethodsMock[0].authenticate.mockRejectedValue(
        new InvalidClientException({ error_description: 'Invalid Credentials.' })
      );

      request.body.token = 'token';

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<Response>>({
        body: Buffer.from(
          JSON.stringify({ error: 'invalid_client', error_description: 'Invalid Credentials.' }),
          'utf8'
        ),
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        statusCode: 401,
      });

      clientAuthenticationMethodsMock[0].hasBeenRequested.mockReset();
      clientAuthenticationMethodsMock[0].authenticate.mockReset();
    });

    it('should revoke a Token.', async () => {
      const spy = jest.spyOn<RevocationEndpointMock, any>(endpoint, 'revokeToken');

      clientAuthenticationMethodsMock[0].hasBeenRequested.mockReturnValue(true);
      clientAuthenticationMethodsMock[0].authenticate.mockResolvedValue(client);

      request.body.token = 'token';

      await expect(endpoint.handle(request)).resolves.toMatchObject<Partial<Response>>({
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
        statusCode: 200,
      });

      expect(spy).toHaveBeenCalledTimes(1);

      clientAuthenticationMethodsMock[0].hasBeenRequested.mockReset();
      clientAuthenticationMethodsMock[0].authenticate.mockReset();

      spy.mockRestore();
    });
  });
});
