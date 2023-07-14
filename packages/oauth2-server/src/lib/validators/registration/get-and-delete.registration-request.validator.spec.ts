import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { removeNullishValues } from '@guarani/primitives';

import { DeleteRegistrationContext } from '../../context/registration/delete.registration-context';
import { GetRegistrationContext } from '../../context/registration/get.registration-context';
import { AccessToken } from '../../entities/access-token.entity';
import { InsufficientScopeException } from '../../exceptions/insufficient-scope.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { InvalidTokenException } from '../../exceptions/invalid-token.exception';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { HttpRequest } from '../../http/http.request';
import { HttpMethod } from '../../http/http-method.type';
import { DeleteRegistrationRequest } from '../../requests/registration/delete.registration-request';
import { GetRegistrationRequest } from '../../requests/registration/get.registration-request';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { GetAndDeleteRegistrationRequestValidator } from './get-and-delete.registration-request.validator';

jest.mock('../../handlers/client-authorization.handler');

describe('Get and Delete Registration Request Validator', () => {
  let validator: GetAndDeleteRegistrationRequestValidator;

  const clientAuthorizationHandlerMock = jest.mocked(ClientAuthorizationHandler.prototype);

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    validator = Reflect.construct(GetAndDeleteRegistrationRequestValidator, [
      clientAuthorizationHandlerMock,
      accessTokenServiceMock,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe.each<HttpMethod>(['GET', 'DELETE'])('validate()', (method) => {
    const scopes: Record<string, string[][][]> = {
      GET: [[['client:manage']], [['client:read']], [['client:manage', 'client:read']]],
      DELETE: [[['client:manage']], [['client:delete']], [['client:manage', 'client:delete']]],
    };

    let parameters: GetRegistrationRequest | DeleteRegistrationRequest;

    const requestFactory = (data: Partial<GetRegistrationRequest | DeleteRegistrationRequest> = {}): HttpRequest => {
      removeNullishValues<GetRegistrationRequest | DeleteRegistrationRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method,
        url: new URL(`https://server.example.com/oauth/register?${stringifyQs(parameters)}`),
      });
    };

    beforeEach(() => {
      Reflect.set(validator, 'expectedScopes', scopes[method]![2]![0]);
      parameters = { client_id: 'client_id' };
    });

    it('should throw when not providing the parameter "client_id".', async () => {
      const request = requestFactory({ client_id: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "client_id".'
      );
    });

    it('should throw when the client fails the authorization process.', async () => {
      const request = requestFactory();

      const error = new InvalidTokenException('Lorem ipsum dolor sit amet...');
      clientAuthorizationHandlerMock.authorize.mockRejectedValueOnce(error);
      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it('should throw when providing an initial access token.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{ handle: 'access_token', client: null };

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Invalid Credentials.'
      );
    });

    it('should throw when the client presents an access token that was not issued to itself.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{ handle: 'access_token', client: { id: 'another_client_id' } };

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InsufficientScopeException,
        'Invalid Credentials.'
      );

      expect(accessTokenServiceMock.revoke).toHaveBeenCalledTimes(1);
      expect(accessTokenServiceMock.revoke).toHaveBeenCalledWith(accessToken);
    });

    it('should throw when the client presents an access token that is not a registration access token.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{
        handle: 'access_token',
        scopes: ['foo', 'bar', 'baz', 'qux'],
        client: { id: 'client_id' },
      };

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InsufficientScopeException,
        'Invalid Credentials.'
      );
    });

    it.each(scopes[method]!)('should return a registration request context.', async (scopes) => {
      const request = requestFactory();

      const accessToken = <AccessToken>{ handle: 'access_token', scopes, client: { id: 'client_id' } };

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(validator.validate(request)).resolves.toStrictEqual<
        GetRegistrationContext | DeleteRegistrationContext
      >({
        parameters,
        accessToken,
        client: accessToken.client!,
      });
    });
  });
});
