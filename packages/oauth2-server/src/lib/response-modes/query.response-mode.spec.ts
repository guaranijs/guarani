import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { Logger } from '../logger/logger';
import { QueryResponseMode } from './query.response-mode';
import { ResponseMode } from './response-mode.type';

jest.mock('../logger/logger');

describe('Query Response Mode', () => {
  let container: DependencyInjectionContainer;
  let responseMode: QueryResponseMode;

  const loggerMock = jest.mocked(Logger.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(QueryResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(QueryResponseMode);
  });

  describe('name', () => {
    it('should have "query" as its value.', () => {
      expect(responseMode.name).toEqual<ResponseMode>('query');
    });
  });

  describe('createHttpResponse()', () => {
    it('should create a redirect http response with a populated uri query.', async () => {
      const context = <AuthorizationContext>{
        redirectUri: new URL('https://example.com'),
      };

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
        Location: 'https://example.com/?var1=string&var2=123&var3=true',
      });
    });

    it('should create a redirect http response with a populated uri query preserving the previous parameters.', async () => {
      const context = <AuthorizationContext>{
        redirectUri: new URL('https://example.com/?tenant=tenant_id'),
      };

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
        Location: 'https://example.com/?tenant=tenant_id&var1=string&var2=123&var3=true',
      });
    });
  });
});
