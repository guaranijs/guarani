import { Attributes } from '@guarani/types';

import { HttpResponse } from '../../lib/http/http.response';
import { QueryResponseMode } from '../../lib/response-modes/query.response-mode';
import { ResponseMode } from '../../lib/types/response-mode';

const responseMode = new QueryResponseMode();

describe('Query Response Mode', () => {
  it('should have "query" as its name.', () => {
    expect(responseMode.name).toBe<ResponseMode>('query');
  });

  it('should create a redirect http response with a populated uri query.', () => {
    expect(
      responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })
    ).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.alloc(0),
      headers: { Location: 'https://example.com/?foo=foo&bar=bar&baz=baz' },
      statusCode: 303,
    });
  });
});
