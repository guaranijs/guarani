import { Request } from '../../lib/http/request';
import { RequestParams } from '../../lib/http/request.params';

describe('Request', () => {
  it.each(['put', 'patch', 'delete'])('should reject an unsupported HTTP Method.', (method) => {
    // @ts-expect-error Unsupported HTTP Method.
    expect(() => new Request({ method, query: {}, headers: {}, body: {} })).toThrow();
  });

  it('should create a Request.', () => {
    expect(
      new Request({
        method: 'get',
        query: { foo: 'foo', bar: 'bar' },
        headers: { host: 'example.com' },
        body: {},
      })
    ).toMatchObject<RequestParams>({
      method: 'get',
      query: { foo: 'foo', bar: 'bar' },
      headers: { host: 'example.com' },
      body: {},
    });
  });
});
