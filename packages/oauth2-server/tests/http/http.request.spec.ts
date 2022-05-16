import { HttpRequest } from '../../lib/http/http.request';

describe('HTTP Request', () => {
  it('should create a request.', () => {
    expect(
      new HttpRequest({
        method: 'get',
        query: { foo: 'foo', bar: 'bar' },
        headers: { host: 'example.com' },
        body: {},
      })
    ).toMatchObject<HttpRequest>({
      method: 'get',
      query: { foo: 'foo', bar: 'bar' },
      headers: { host: 'example.com' },
      body: {},
    });
  });

  it('should create a request transforming the method to lowercase.', () => {
    expect(
      new HttpRequest({
        method: <any>'GET',
        query: { foo: 'foo', bar: 'bar' },
        headers: { host: 'example.com' },
        body: {},
      })
    ).toMatchObject<HttpRequest>({
      method: 'get',
      query: { foo: 'foo', bar: 'bar' },
      headers: { host: 'example.com' },
      body: {},
    });
  });

  it('should create a request with an authenticated user.', () => {
    expect(
      new HttpRequest({
        method: 'get',
        query: { foo: 'foo' },
        headers: { host: 'example.com' },
        body: {},
        user: { id: 'user_id' },
      })
    ).toMatchObject<HttpRequest>({
      method: 'get',
      query: { foo: 'foo' },
      headers: { host: 'example.com' },
      body: {},
      user: { id: 'user_id' },
    });
  });

  it('should create a request and then add an authenticated user.', () => {
    const request = new HttpRequest({
      method: 'get',
      query: { foo: 'foo' },
      headers: { host: 'example.com' },
      body: {},
    });

    request.user = { id: 'user_id' };

    expect(request).toMatchObject<HttpRequest>({
      method: 'get',
      query: { foo: 'foo' },
      headers: { host: 'example.com' },
      body: {},
      user: { id: 'user_id' },
    });
  });
});
