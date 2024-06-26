import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { AuthorizationCodeTokenContext } from '../../context/token/authorization-code.token-context';
import { AuthorizationCode } from '../../entities/authorization-code.entity';
import { Client } from '../../entities/client.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { AuthorizationCodeTokenRequest } from '../../requests/token/authorization-code.token-request';
import { AuthorizationCodeServiceInterface } from '../../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../../services/authorization-code.service.token';
import { AuthorizationCodeTokenRequestValidator } from './authorization-code.token-request.validator';

jest.mock('../../handlers/client-authentication.handler');
jest.mock('../../logger/logger');

describe('Authorization Code Token Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: AuthorizationCodeTokenRequestValidator;

  const loggerMock = jest.mocked(Logger.prototype);

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype);

  const authorizationCodeServiceMock = jest.mocked<AuthorizationCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const grantTypesMocks = [
    jest.mocked<GrantTypeInterface>({ name: 'authorization_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'client_credentials', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'password', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'refresh_token', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:device_code', handle: jest.fn() }),
    jest.mocked<GrantTypeInterface>({ name: 'urn:ietf:params:oauth:grant-type:jwt-bearer', handle: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(ClientAuthenticationHandler).toValue(clientAuthenticationHandlerMock);
    container.bind<AuthorizationCodeServiceInterface>(AUTHORIZATION_CODE_SERVICE).toValue(authorizationCodeServiceMock);

    grantTypesMocks.forEach((grantTypeMock) => {
      container.bind<GrantTypeInterface>(GRANT_TYPE).toValue(grantTypeMock);
    });

    container.bind(AuthorizationCodeTokenRequestValidator).toSelf().asSingleton();

    validator = container.resolve(AuthorizationCodeTokenRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "authorization_code" as its value.', () => {
      expect(validator.name).toEqual<GrantType>('authorization_code');
    });
  });

  describe('validate()', () => {
    let parameters: AuthorizationCodeTokenRequest;

    const requestFactory = (data: Partial<AuthorizationCodeTokenRequest> = {}): HttpRequest => {
      removeNullishValues<AuthorizationCodeTokenRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/token'),
      });
    };

    beforeEach(() => {
      parameters = {
        grant_type: 'authorization_code',
        code: 'code',
        redirect_uri: 'https://client.example.com/oauth/callback',
        code_verifier: 'code_challenge',
      };
    });

    it('should throw when not providing the parameter "code".', async () => {
      const request = requestFactory({ code: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        grantTypes: ['authorization_code'],
      });

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "code".',
      );
    });

    it('should throw when no authorization code is found.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        grantTypes: ['authorization_code'],
      });

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidGrantException,
        'Invalid Authorization Code.',
      );
    });

    it('should throw when not providing the parameter "redirect_uri".', async () => {
      const request = requestFactory({ redirect_uri: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        grantTypes: ['authorization_code'],
      });

      const authorizationCode: AuthorizationCode = Object.assign<AuthorizationCode, Partial<AuthorizationCode>>(
        Reflect.construct(AuthorizationCode, []),
        { id: 'code' },
      );

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "redirect_uri".',
      );
    });

    it('should throw when providing an invalid redirect uri.', async () => {
      const request = requestFactory({ redirect_uri: 'client.example.com/oauth/callback' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        grantTypes: ['authorization_code'],
      });

      const authorizationCode: AuthorizationCode = Object.assign<AuthorizationCode, Partial<AuthorizationCode>>(
        Reflect.construct(AuthorizationCode, []),
        { id: 'code' },
      );

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "redirect_uri".',
      );
    });

    it('should throw when the provided redirect uri has a fragment component.', async () => {
      const request = requestFactory({ redirect_uri: 'https://client.example.com/oauth/callback#foo=bar' });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        grantTypes: ['authorization_code'],
      });

      const authorizationCode: AuthorizationCode = Object.assign<AuthorizationCode, Partial<AuthorizationCode>>(
        Reflect.construct(AuthorizationCode, []),
        { id: 'code' },
      );

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'The Redirect URI MUST NOT have a fragment component.',
      );
    });

    it('should throw when the client is not allowed to use the provided redirect uri.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.org/oauth/callback'],
        grantTypes: ['authorization_code'],
      });

      const authorizationCode: AuthorizationCode = Object.assign<AuthorizationCode, Partial<AuthorizationCode>>(
        Reflect.construct(AuthorizationCode, []),
        { id: 'code' },
      );

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Redirect URI.',
      );
    });

    it('should throw when not providing the parameter "code_verifier".', async () => {
      const request = requestFactory({ code_verifier: undefined });

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        grantTypes: ['authorization_code'],
      });

      const authorizationCode: AuthorizationCode = Object.assign<AuthorizationCode, Partial<AuthorizationCode>>(
        Reflect.construct(AuthorizationCode, []),
        { id: 'code' },
      );

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "code_verifier".',
      );
    });

    it('should return an authorization code token context.', async () => {
      const request = requestFactory();

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        grantTypes: ['authorization_code'],
      });

      const authorizationCode: AuthorizationCode = Object.assign<AuthorizationCode, Partial<AuthorizationCode>>(
        Reflect.construct(AuthorizationCode, []),
        { id: 'code' },
      );

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).resolves.toStrictEqual<AuthorizationCodeTokenContext>({
        parameters,
        client,
        grantType: grantTypesMocks[0]!,
        authorizationCode,
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        codeVerifier: 'code_challenge',
      });
    });
  });
});
