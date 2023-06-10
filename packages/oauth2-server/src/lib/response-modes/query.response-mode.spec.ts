import { OutgoingHttpHeaders } from 'http';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { QueryResponseMode } from './query.response-mode';
import { ResponseMode } from './response-mode.type';

describe('Query Response Mode', () => {
  let container: DependencyInjectionContainer;
  let responseMode: QueryResponseMode;

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(QueryResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(QueryResponseMode);
  });

  describe('name', () => {
    it('should have "query" as its value.', () => {
      expect(responseMode.name).toEqual<ResponseMode>('query');
    });
  });

  describe('createHttpResponse()', () => {
    it('should create a redirect http response with a populated uri query.', () => {
      const response = responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?foo=foo&bar=bar&baz=baz',
      });
    });

    it('should create a redirect http response with a populated uri query preserving the previous parameters.', () => {
      const response = responseMode.createHttpResponse('https://example.com/?tenant=tenant_id', {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz',
      });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?tenant=tenant_id&foo=foo&bar=bar&baz=baz',
      });
    });
  });
});
