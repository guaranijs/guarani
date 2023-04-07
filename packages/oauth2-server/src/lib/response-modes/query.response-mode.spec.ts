import { DependencyInjectionContainer } from '@guarani/di';

import { HttpResponse } from '../http/http.response';
import { QueryResponseMode } from './query.response-mode';
import { ResponseMode } from './response-mode.type';

describe('Query Response Mode', () => {
  let responseMode: QueryResponseMode;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(QueryResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(QueryResponseMode);
  });

  it('should have "query" as its name.', () => {
    expect(responseMode.name).toEqual<ResponseMode>('query');
  });

  it('should create a redirect http response with a populated uri query.', () => {
    expect(
      responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })
    ).toStrictEqual(new HttpResponse().redirect('https://example.com/?foo=foo&bar=bar&baz=baz'));
  });
});
