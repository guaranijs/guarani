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

  describe('data', () => {
    it('should return the data of the Query when the HTTP Method is GET.', () => {
      expect(
        new Request({ body: { foo: 'foo' }, headers: {}, method: 'get', query: { bar: 'bar' } }).data
      ).toMatchObject({ bar: 'bar' });
    });

    it('should merge the data from the Query and the Body when the HTTP Method is POST.', () => {
      expect(
        new Request({
          body: { foo: 'foo', bar: 'bar_' },
          headers: {},
          method: 'post',
          query: { bar: 'bar', baz: 'baz' },
        }).data
      ).toMatchObject({ foo: 'foo', bar: 'bar_', baz: 'baz' });
    });
  });
});
