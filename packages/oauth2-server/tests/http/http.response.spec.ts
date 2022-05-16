import { Attributes } from '@guarani/types';

import { URL } from 'url';

import { HttpResponse } from '../../lib/http/http.response';

describe('HTTP Response', () => {
  it('should create a standard http response.', () => {
    expect(new HttpResponse()).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.alloc(0),
      headers: {},
      statusCode: 200,
    });
  });

  it('should set a custom status code.', () => {
    expect(new HttpResponse().setStatus(201)).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.alloc(0),
      headers: {},
      statusCode: 201,
    });
  });

  it('should set a custom header.', () => {
    expect(new HttpResponse().setHeader('X-Foo', 'foo-value')).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.alloc(0),
      headers: { 'X-Foo': 'foo-value' },
      statusCode: 200,
    });
  });

  it('should set multiple custom headers.', () => {
    expect(new HttpResponse().setHeaders({ 'X-Foo': 'foo-value', 'X-Bar': 'bar-value' })).toMatchObject<
      Attributes<HttpResponse>
    >({
      body: Buffer.alloc(0),
      headers: { 'X-Foo': 'foo-value', 'X-Bar': 'bar-value' },
      statusCode: 200,
    });
  });

  it('should create a json response.', () => {
    expect(new HttpResponse().json({ foo: 'bar' })).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf8'),
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
    });
  });

  it('should create a redirect response.', () => {
    expect(new HttpResponse().redirect('https://example.com')).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.alloc(0),
      headers: { Location: 'https://example.com' },
      statusCode: 303,
    });

    expect(new HttpResponse().redirect(new URL('https://example.com'))).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.alloc(0),
      headers: { Location: expect.stringContaining('https://example.com') },
      statusCode: 303,
    });
  });

  it('should create an html response.', () => {
    expect(new HttpResponse().html('<html></html>')).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.from('<html></html>', 'utf8'),
      headers: {},
      statusCode: 200,
    });
  });
});
