import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';
import { URL } from 'url';

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
import { AuthorizationCodeTokenRequest } from '../../requests/token/authorization-code.token-request';
import { AuthorizationCodeServiceInterface } from '../../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../../services/authorization-code.service.token';
import { AuthorizationCodeTokenRequestValidator } from './authorization-code.token-request.validator';

jest.mock('../../handlers/client-authentication.handler');

const invalidCodes: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidRedirectUris: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidCodeVerifiers: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('Authorization Code Token Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: AuthorizationCodeTokenRequestValidator;

  const clientAuthenticationHandlerMock = jest.mocked(ClientAuthenticationHandler.prototype, true);

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
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {
          grant_type: 'authorization_code',
          code: 'code',
          redirect_uri: 'https://client.example.com/oauth/callback',
          code_verifier: 'code_challenge',
        },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/token',
        query: {},
      });
    });

    it.each(invalidCodes)('should throw when providing an invalid "code" parameter.', async (code) => {
      request.body.code = code;

      const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "code".' })
      );
    });

    it('should throw when no authorization code is found.', async () => {
      const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code'] };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidGrantException({ description: 'Invalid Authorization Code.' })
      );
    });

    it.each(invalidRedirectUris)(
      'should throw when providing an invalid "redirect_uri" parameter.',
      async (redirectUri) => {
        request.body.redirect_uri = redirectUri;

        const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code'] };
        const authorizationCode = <AuthorizationCode>{ code: 'code' };

        clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
        authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".' })
        );
      }
    );

    it('should throw when providing an invalid redirect uri.', async () => {
      request.body.redirect_uri = 'client.example.com/oauth/callback';

      const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code'] };
      const authorizationCode = <AuthorizationCode>{ code: 'code' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".' })
      );
    });

    it('should throw when the provided redirect uri has a fragment component.', async () => {
      request.body.redirect_uri = 'https://client.example.com/oauth/callback#foo=bar';

      const client = <Client>{ id: 'client_id', grantTypes: ['authorization_code'] };
      const authorizationCode = <AuthorizationCode>{ code: 'code' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRequestException({ description: 'The Redirect URI MUST NOT have a fragment component.' })
      );
    });

    it('should throw when the client is not allowed to use the provided redirect uri.', async () => {
      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.org/oauth/callback'],
        grantTypes: ['authorization_code'],
      };
      const authorizationCode = <AuthorizationCode>{ code: 'code' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Redirect URI.' })
      );
    });

    it.each(invalidCodeVerifiers)(
      'should throw when providing an invalid "code_verifier" parameter.',
      async (codeVerifier) => {
        request.body.code_verifier = codeVerifier;

        const client = <Client>{
          id: 'client_id',
          redirectUris: ['https://client.example.com/oauth/callback'],
          grantTypes: ['authorization_code'],
        };
        const authorizationCode = <AuthorizationCode>{ code: 'code' };

        clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
        authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidRequestException({ description: 'Invalid parameter "code_verifier".' })
        );
      }
    );

    it('should return an authorization code token context.', async () => {
      const client = <Client>{
        id: 'client_id',
        redirectUris: ['https://client.example.com/oauth/callback'],
        grantTypes: ['authorization_code'],
      };
      const authorizationCode = <AuthorizationCode>{ code: 'code' };

      clientAuthenticationHandlerMock.authenticate.mockResolvedValueOnce(client);
      authorizationCodeServiceMock.findOne.mockResolvedValueOnce(authorizationCode);

      await expect(validator.validate(request)).resolves.toStrictEqual<AuthorizationCodeTokenContext>({
        parameters: <AuthorizationCodeTokenRequest>request.body,
        client,
        grantType: grantTypesMocks[0]!,
        authorizationCode,
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        codeVerifier: 'code_challenge',
      });
    });
  });
});
