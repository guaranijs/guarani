import { HttpRequestParameters } from './http-request.parameters';
import { HttpRequest } from './http.request';

const invalidHttpMethods: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Buffer,
  Buffer.alloc(1),
  Symbol('a'),
  () => 1,
  {},
  [],
];

const unsupportedHttpMethods: string[] = [
  'get',
  'head',
  'post',
  'put',
  'delete',
  'connect',
  'options',
  'trace',
  'patch',
  'HEAD',
  'CONNECT',
  'OPTIONS',
  'TRACE',
  'PATCH',
];

describe('Http Request', () => {
  it.each(invalidHttpMethods)('should throw when not passing a string as its method.', (method) => {
    expect(() => new HttpRequest(<HttpRequestParameters>{ method })).toThrow(
      new Error('The Http Method must be a valid string.')
    );
  });

  it.each(unsupportedHttpMethods)('should throw when not passing "GET" or "POST" as its method.', (method) => {
    expect(() => new HttpRequest(<HttpRequestParameters>{ method })).toThrow(
      new Error(`The Http Method "${method}" is invalid.`)
    );
  });

  it('should return a valid http delete request.', () => {
    let httpRequest!: HttpRequest;

    const parameters: HttpRequestParameters = {
      method: 'DELETE',
      path: '/p/a/t/h',
      query: { entity_id: 'entity_id' },
      headers: { origin: 'server.example.com' },
      cookies: { guarani: 'guarani_cookie' },
      body: {},
    };

    expect(() => (httpRequest = new HttpRequest(parameters))).not.toThrow();

    expect(httpRequest).toMatchObject(parameters);
  });

  it('should return a valid http get request.', () => {
    let httpRequest!: HttpRequest;

    const parameters: HttpRequestParameters = {
      method: 'GET',
      path: '/p/a/t/h',
      query: { foo: 'foo', bar: 'bar' },
      headers: { origin: 'server.example.com' },
      cookies: { guarani: 'guarani_cookie' },
      body: {},
    };

    expect(() => (httpRequest = new HttpRequest(parameters))).not.toThrow();

    expect(httpRequest).toMatchObject(parameters);
  });

  it('should return a valid http post request.', () => {
    let httpRequest!: HttpRequest;

    const parameters: HttpRequestParameters = {
      method: 'POST',
      path: '/p/a/t/h',
      query: {},
      headers: { origin: 'server.example.com' },
      cookies: { guarani: 'guarani_cookie' },
      body: { foo: 'foo', bar: 'bar' },
    };

    expect(() => (httpRequest = new HttpRequest(parameters))).not.toThrow();

    expect(httpRequest).toMatchObject(parameters);
  });

  it('should return a valid http put request.', () => {
    let httpRequest!: HttpRequest;

    const parameters: HttpRequestParameters = {
      method: 'PUT',
      path: '/p/a/t/h',
      query: { entity_id: 'entity_id' },
      headers: { origin: 'server.example.com' },
      cookies: { guarani: 'guarani_cookie' },
      body: { foo: 'foo', bar: 'bar' },
    };

    expect(() => (httpRequest = new HttpRequest(parameters))).not.toThrow();

    expect(httpRequest).toMatchObject(parameters);
  });
});
