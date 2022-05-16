import { IClientAuthentication } from '../../lib/client-authentication/client-authentication.interface';
import { ClientAuthenticator } from '../../lib/client-authentication/client-authenticator';
import { Client } from '../../lib/entities/client';
import { InvalidClientException } from '../../lib/exceptions/invalid-client.exception';
import { HttpRequest } from '../../lib/http/http.request';

const client = <Client>{
  id: 'client_id',
  secret: 'client_secret',
  authenticationMethod: 'client_secret_basic',
};

const clientAuthenticationMethodsMock: jest.Mocked<IClientAuthentication>[] = [
  { name: 'client_secret_basic', hasBeenRequested: jest.fn(), authenticate: jest.fn() },
  { name: 'client_secret_post', hasBeenRequested: jest.fn(), authenticate: jest.fn() },
  { name: 'none', hasBeenRequested: jest.fn(), authenticate: jest.fn() },
];

const authenticator = new ClientAuthenticator(clientAuthenticationMethodsMock);

describe('Client Authenticator', () => {
  let request: HttpRequest;

  beforeEach(() => {
    request = new HttpRequest({ body: {}, headers: {}, method: 'post', query: {} });
  });

  afterEach(() => {
    clientAuthenticationMethodsMock.forEach((method) => {
      method.hasBeenRequested.mockReset();
      method.authenticate.mockReset();
    });
  });

  it('should reject not using a client authentication method.', async () => {
    clientAuthenticationMethodsMock.forEach((method) => method.hasBeenRequested.mockReturnValue(false));
    await expect(authenticator.authenticate(request)).rejects.toThrow(InvalidClientException);
  });

  it('should reject using multiple client authentication methods.', async () => {
    clientAuthenticationMethodsMock.forEach((method) => method.hasBeenRequested.mockReturnValue(true));
    await expect(authenticator.authenticate(request)).rejects.toThrow(InvalidClientException);
  });

  it('should return an authenticated client.', async () => {
    clientAuthenticationMethodsMock[0].hasBeenRequested.mockReturnValue(true);
    clientAuthenticationMethodsMock[0].authenticate.mockResolvedValue(client);

    await expect(authenticator.authenticate(request)).resolves.toBe(client);
  });
});
