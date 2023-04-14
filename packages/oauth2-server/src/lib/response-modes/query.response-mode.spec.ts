import { DependencyInjectionContainer } from '@guarani/di';

import { HttpResponse } from '../http/http.response';
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
      expect(
        responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })
      ).toStrictEqual(new HttpResponse().redirect('https://example.com/?foo=foo&bar=bar&baz=baz'));
    });
  });
});
