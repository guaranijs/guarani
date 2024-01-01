import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { AuthorizationResponseTokenHandler } from '../handlers/authorization-response-token.handler';
import { QueryJwtResponseMode } from './query-jwt.response-mode';
import { ResponseMode } from './response-mode.type';

jest.mock('../handlers/authorization-response-token.handler');

describe('Query JSON Web Token Response Mode', () => {
  let container: DependencyInjectionContainer;
  let responseMode: QueryJwtResponseMode;

  const authorizationResponseTokenHandlerMock = jest.mocked(AuthorizationResponseTokenHandler.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(AuthorizationResponseTokenHandler).toValue(authorizationResponseTokenHandlerMock);
    container.bind(QueryJwtResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(QueryJwtResponseMode);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "query.jwt" as its value.', () => {
      expect(responseMode.name).toEqual<ResponseMode>('query.jwt');
    });
  });

  describe('createHttpResponse()', () => {
    it('should create a redirect http response with a populated uri query.', async () => {
      const context = <AuthorizationContext>{
        redirectUri: new URL('https://example.com'),
      };

      authorizationResponseTokenHandlerMock.generateAuthorizationResponseToken.mockResolvedValueOnce(
        'authorization_response_token',
      );

      const response = await responseMode.createHttpResponse(context, {
        var1: 'string',
        var2: 123,
        var3: true,
        var4: null,
        var5: undefined,
      });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?response=authorization_response_token',
      });
    });

    it('should create a redirect http response with a populated uri query preserving the previous parameters.', async () => {
      const context = <AuthorizationContext>{
        redirectUri: new URL('https://example.com/?tenant=tenant_id'),
      };

      authorizationResponseTokenHandlerMock.generateAuthorizationResponseToken.mockResolvedValueOnce(
        'authorization_response_token',
      );

      const response = await responseMode.createHttpResponse(context, {
        var1: 'string',
        var2: 123,
        var3: true,
        var4: null,
        var5: undefined,
      });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?tenant=tenant_id&response=authorization_response_token',
      });
    });
  });
});
