import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { DisplayInterface } from '../displays/display.interface';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { Logger } from '../logger/logger';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { ResponseMode } from '../response-modes/response-mode.type';
import { IdTokenAuthorizationResponse } from '../responses/authorization/id-token.authorization-response';
import { IdTokenResponseType } from './id-token.response-type';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

jest.mock('../handlers/id-token.handler');
jest.mock('../logger/logger');

describe('ID Token Response Type', () => {
  let container: DependencyInjectionContainer;
  let responseType: IdTokenResponseType;

  const loggerMock = jest.mocked(Logger.prototype);
  const idTokenHandlerMock = jest.mocked(IdTokenHandler.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(IdTokenHandler).toValue(idTokenHandlerMock);
    container.bind(IdTokenResponseType).toSelf().asSingleton();

    responseType = container.resolve(IdTokenResponseType);
  });

  describe('name', () => {
    it('should have "id_token" as its name.', () => {
      expect(responseType.name).toEqual<ResponseType>('id_token');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "fragment" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toEqual<ResponseMode>('fragment');
    });
  });

  describe('handle()', () => {
    let context: AuthorizationContext;

    beforeEach(() => {
      context = <AuthorizationContext>{
        parameters: {
          response_type: 'id_token',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'openid foo bar',
          state: 'client_state',
          nonce: 'client_nonce',
        },
        cookies: {},
        responseType: jest.mocked<ResponseTypeInterface>({
          name: 'id_token',
          defaultResponseMode: 'fragment',
          handle: jest.fn(),
        }),
        client: <Client>{ id: 'client_id' },
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        scopes: ['openid', 'foo', 'bar'],
        state: 'client_state',
        responseMode: jest.mocked<ResponseModeInterface>({ name: 'fragment', createHttpResponse: jest.fn() }),
        nonce: 'client_nonce',
        prompts: [],
        display: jest.mocked<DisplayInterface>({ name: 'page', createHttpResponse: jest.fn() }),
        maxAge: null,
        loginHint: null,
        idTokenHint: null,
        uiLocales: [],
        acrValues: [],
      };
    });

    it('should throw when not providing the "openid" scope.', async () => {
      Reflect.set(context.parameters, 'scope', 'foo bar');
      Reflect.set(context, 'scopes', ['foo', 'bar']);

      const login = <Login>{};
      const consent = <Consent>{
        scopes: ['foo', 'bar'],
        client: { id: 'client_id' },
        user: { id: 'user_id' },
      };

      await expect(responseType.handle(context, login, consent)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Missing required scope "openid".',
      );
    });

    it('should create an id token authorization response.', async () => {
      const login = <Login>{};
      const consent = <Consent>{
        scopes: ['openid', 'foo', 'bar'],
        client: { id: 'client_id' },
        user: { id: 'user_id' },
      };

      idTokenHandlerMock.generateIdToken.mockResolvedValueOnce('id_token');

      await expect(responseType.handle(context, login, consent)).resolves.toStrictEqual<IdTokenAuthorizationResponse>({
        id_token: 'id_token',
      });
    });
  });
});
