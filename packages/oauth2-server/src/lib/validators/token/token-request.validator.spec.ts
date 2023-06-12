import { Buffer } from 'buffer';
import { URL, URLSearchParams } from 'url';

import { removeNullishValues } from '@guarani/primitives';
import { OneOrMany } from '@guarani/types';

import { TokenContext } from '../../context/token/token-context';
import { Client } from '../../entities/client.entity';
import { InvalidClientException } from '../../exceptions/invalid-client.exception';
import { UnauthorizedClientException } from '../../exceptions/unauthorized-client.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { HttpRequest } from '../../http/http.request';
import { TokenRequest } from '../../requests/token/token-request';
import { TokenRequestValidator } from './token-request.validator';

jest.mock('../../handlers/client-authentication.handler');

describe('Token Request Validator', () => {
  let validator: TokenRequestValidator<TokenContext>;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype);

  const grantTypesMocks = [
    jest.mocked<GrantTypeInterface>({ name: 'authorization_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'client_credentials', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'password', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'refresh_token', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:device_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:jwt-bearer', handle: jest.fn() }),
  ];

  beforeEach(() => {
    validator = Reflect.construct(TokenRequestValidator, [clientAuthenticationHandlerMock, grantTypesMocks]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validate()', () => {
    let parameters: TokenRequest;

    const requestFactory = (data: Partial<TokenRequest> = {}): HttpRequest => {
      parameters = removeNullishValues<TokenRequest>(Object.assign(parameters, data));

      const body = new URLSearchParams(parameters as Record<string, OneOrMany<string>>);

      return new HttpRequest({
        body: Buffer.from(body.toString(), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = { grant_type: 'authorization_code' };
    });

    it('should throw when the client fails to authenticate.', async () => {
      const request = requestFactory();

      const error = new InvalidClientException('Lorem ipsum dolor sit amet...');
      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);
      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it('should throw when the client is not allowed to request the provided "grant_type".', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id', grantTypes: ['client_credentials'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        UnauthorizedClientException,
        'This Client is not allowed to request the grant_type "authorization_code".'
      );
    });

    it('should return a token context.', async () => {
      const request = requestFactory();

      const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).resolves.toStrictEqual<TokenContext>({
        parameters: request.form(),
        client,
        grantType: grantTypesMocks[0]!,
      });
    });
  });
});
