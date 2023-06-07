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
  let validator: TokenRequestValidator<TokenRequest, TokenContext<TokenRequest>>;

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
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <TokenRequest>{ grant_type: 'authorization_code' },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      });
    });

    it('should throw when the client fails to authenticate.', async () => {
      const error = new InvalidClientException('Lorem ipsum dolor sit amet...');
      clientAuthenticationHandlerMock.authenticate.mockRejectedValueOnce(error);
      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it('should throw when the client is not allowed to request the provided "grant_type".', async () => {
      const client = <Client>{ id: 'client_id', grantTypes: ['client_credentials'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        UnauthorizedClientException,
        'This Client is not allowed to request the grant_type "authorization_code".'
      );
    });

    it('should return a token context.', async () => {
      const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).resolves.toStrictEqual<TokenContext>({
        parameters: request.body as TokenRequest,
        client,
        grantType: grantTypesMocks[0]!,
      });
    });
  });
});
