import { Optional } from '@guarani/types';

import { IncomingHttpHeaders } from 'http';
import { URL } from 'url';

import { ClientSecretBasicClientAuthentication } from '../../lib/client-authentication/client-secret-basic.client-authentication';
import { SupportedClientAuthentication } from '../../lib/client-authentication/types/supported-client-authentication';
import { ClientEntity } from '../../lib/entities/client.entity';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { Request } from '../../lib/http/request';

const clientSecretBasic = <ClientEntity>{
  id: 'client_id',
  secret: 'client_secret',
  redirectUris: [new URL('https://example.com/callback')],
  authenticationMethod: 'client_secret_basic',
  grantTypes: ['authorization_code'],
  responseTypes: ['code'],
  scopes: ['scope1', 'scope2'],
};

const clientSecretPost = <ClientEntity>{
  id: 'id_client',
  secret: 'secret_client',
  redirectUris: [new URL('https://example.com/callback')],
  authenticationMethod: 'client_secret_post',
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

const clientServiceMock: any = {
  findClient: async (clientId: string): Promise<Optional<ClientEntity>> => {
    return [clientSecretBasic, clientSecretPost, clientNone].find((client) => client.id === clientId);
  },
};

const method = new ClientSecretBasicClientAuthentication(clientServiceMock);

const methodRequests: [IncomingHttpHeaders, boolean][] = [
  [{}, false],
  [{ authorization: '' }, false],
  [{ authorization: 'Bearer' }, false],
  [{ authorization: 'Basic' }, true],
  [{ authorization: 'Basic ' }, true],
  [{ authorization: 'Basic $' }, true],
  [{ authorization: 'Basic 123abcDEF+/=' }, true],
];

describe('Client Secret Basic Authentication Method', () => {
  describe('name', () => {
    it('should have "client_secret_basic" as its name.', () => {
      expect(method.name).toBe<SupportedClientAuthentication>('client_secret_basic');
    });
  });

  describe('hasBeenRequested()', () => {
    it.each(methodRequests)('should check if the Authentication Method has beed requested.', (headers, expected) => {
      const request = new Request({ body: {}, headers, method: 'post', query: {} });
      expect(method.hasBeenRequested(request)).toBe(expected);
    });
  });

  describe('authenticate()', () => {
    let request: Request;

    beforeEach(() => {
      request = new Request({ body: {}, headers: {}, method: 'post', query: {} });
    });

    it.each(['Basic', 'Basic '])('should reject an authorization header without a token.', (header) => {
      request.headers.authorization = header;
      expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a token that is not Base64 encoded.', () => {
      request.headers.authorization = 'Basic $';
      expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a token that does not contain a semicolon.', () => {
      request.headers.authorization = 'Basic ' + Buffer.from('foobar', 'utf8').toString('base64');
      expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it.each([':', 'id:', ':secret'])(
      'should reject a token with an empty "client_id" and/or "client_secret".',
      (credentials) => {
        request.headers.authorization = 'Basic ' + Buffer.from(credentials, 'utf8').toString('base64');
        expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
      }
    );

    it('should reject when a Client is not found.', () => {
      request.headers.authorization = 'Basic ' + Buffer.from('unknown_id:unknown_secret', 'utf8').toString('base64');
      expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should reject a Client without a Secret.', () => {
      request.headers.authorization = 'Basic ' + Buffer.from('foobar:barfoo', 'utf8').toString('base64');
      expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it.each(['client_id:unknown_secret', 'client_id:client-secret'])(
      "should reject when the provided Client Secret does not match the Client's one.",
      (unencodedScheme) => {
        request.headers.authorization = 'Basic ' + Buffer.from(unencodedScheme, 'utf8').toString('base64');
        expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
      }
    );

    it('should reject a Client not authorized to use this Authentication Method.', () => {
      request.headers.authorization = 'Basic ' + Buffer.from('id_client:secret_client', 'utf8').toString('base64');
      expect(method.authenticate(request)).rejects.toThrow(InvalidClientException);
    });

    it('should return an instance of a Client Entity.', () => {
      request.headers.authorization = 'Basic ' + Buffer.from('client_id:client_secret', 'utf8').toString('base64');
      expect(method.authenticate(request)).resolves.toMatchObject(clientSecretBasic);
    });
  });
});
