import { Attributes } from '@guarani/types';

import { HttpResponse } from '../../lib/http/http.response';
import { FragmentResponseMode } from '../../lib/response-modes/fragment.response-mode';
import { ResponseMode } from '../../lib/types/response-mode';

const responseMode = new FragmentResponseMode();

describe('Fragment Response Mode', () => {
  it('should have "fragment" as its name.', () => {
    expect(responseMode.name).toBe<ResponseMode>('fragment');
  });

  it('should create a redirect http response with a populated uri fragment.', () => {
    expect(
      responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })
    ).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.alloc(0),
      headers: { Location: 'https://example.com/#foo=foo&bar=bar&baz=baz' },
      statusCode: 303,
    });
  });
});
