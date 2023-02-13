import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';

import { HttpResponse } from '../http/http.response';
import { QueryResponseMode } from './query.response-mode';

describe('Query Response Mode', () => {
  let responseMode: QueryResponseMode;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(QueryResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(QueryResponseMode);
  });

  it('should have "query" as its name.', () => {
    expect(responseMode.name).toBe('query');
  });

  it('should create a redirect http response with a populated uri query.', () => {
    expect(
      responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })
    ).toMatchObject<Partial<HttpResponse>>({
      body: Buffer.alloc(0),
      headers: { Location: 'https://example.com/?foo=foo&bar=bar&baz=baz' },
      statusCode: 303,
    });
  });
});
