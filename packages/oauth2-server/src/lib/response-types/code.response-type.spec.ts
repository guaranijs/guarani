import { DependencyInjectionContainer } from '@guarani/di';

import { CodeAuthorizationContext } from '../context/authorization/code.authorization-context';
import { DisplayInterface } from '../displays/display.interface';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { PkceInterface } from '../pkces/pkce.interface';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { ResponseMode } from '../response-modes/response-mode.type';
import { CodeAuthorizationResponse } from '../responses/authorization/code.authorization-response';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { CodeResponseType } from './code.response-type';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

describe('Code Response Type', () => {
  let container: DependencyInjectionContainer;
  let responseType: CodeResponseType;

  const authorizationCodeServiceMock = jest.mocked<AuthorizationCodeServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<AuthorizationCodeServiceInterface>(AUTHORIZATION_CODE_SERVICE).toValue(authorizationCodeServiceMock);
    container.bind(CodeResponseType).toSelf();

    responseType = container.resolve(CodeResponseType);
  });

  describe('name', () => {
    it('should have "code" as its name.', () => {
      expect(responseType.name).toEqual<ResponseType>('code');
    });
  });

  describe('defaultResponseMode', () => {
    it('should have "query" as its default response mode.', () => {
      expect(responseType.defaultResponseMode).toEqual<ResponseMode>('query');
    });
  });

  describe('handle()', () => {
    let context: CodeAuthorizationContext;

    beforeEach(() => {
      context = <CodeAuthorizationContext>{
        parameters: {
          response_type: 'code',
          client_id: 'client_id',
          redirect_uri: 'https://client.example.com/oauth/callback',
          scope: 'foo bar',
          code_challenge: 'code_challenge',
          code_challenge_method: 'plain',
          state: 'client_state',
          nonce: 'client_nonce',
        },
        cookies: {},
        responseType: jest.mocked<ResponseTypeInterface>({
          name: 'code',
          defaultResponseMode: 'query',
          handle: jest.fn(),
        }),
        client: <Client>{ id: 'client_id' },
        redirectUri: new URL('https://client.example.com/oauth/callback'),
        scopes: ['foo', 'bar'],
        codeChallenge: 'code_challenge',
        codeChallengeMethod: jest.mocked<PkceInterface>({ name: 'plain', verify: jest.fn() }),
        state: 'client_state',
        responseMode: jest.mocked<ResponseModeInterface>({ name: 'query', createHttpResponse: jest.fn() }),
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

    it('should create a code authorization response.', async () => {
      const login = <Login>{};
      const consent = <Consent>{ client: { id: 'client_id' }, user: { id: 'user_id' } };

      const authorizationCode = <AuthorizationCode>{ code: 'authorization_code' };

      authorizationCodeServiceMock.create.mockResolvedValueOnce(authorizationCode);

      await expect(responseType.handle(context, login, consent)).resolves.toStrictEqual<CodeAuthorizationResponse>({
        code: 'authorization_code',
        state: 'client_state',
      });
    });
  });
});
