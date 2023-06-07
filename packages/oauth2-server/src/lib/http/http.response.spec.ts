import { Buffer } from 'buffer';
import { URL } from 'url';

import { HttpResponse } from './http.response';

describe('Http Response', () => {
  describe('constructor', () => {
    it('should create a standard http response.', () => {
      expect(new HttpResponse()).toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: {},
        headers: {},
        statusCode: 200,
      });
    });
  });

  describe('setStatus()', () => {
    it('should set a custom status code.', () => {
      expect(new HttpResponse().setStatus(201)).toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: {},
        headers: {},
        statusCode: 201,
      });
    });
  });

  describe('setHeader()', () => {
    it('should set a custom header.', () => {
      expect(new HttpResponse().setHeader('X-Foo', 'foo-value')).toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: {},
        headers: { 'X-Foo': 'foo-value' },
        statusCode: 200,
      });
    });
  });

  describe('setHeaders()', () => {
    it('should set multiple custom headers.', () => {
      expect(new HttpResponse().setHeaders({ 'X-Foo': 'foo-value', 'X-Bar': 'bar-value' })).toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        cookies: {},
        headers: { 'X-Foo': 'foo-value', 'X-Bar': 'bar-value' },
        statusCode: 200,
      });
    });
  });

  describe('setCookie()', () => {
    it('should set a custom cookie.', () => {
      expect(new HttpResponse().setCookie('foo', 'foo-value')).toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: { foo: 'foo-value' },
        headers: {},
        statusCode: 200,
      });
    });
  });

  describe('setCookies()', () => {
    it('should set multiple custom cookies.', () => {
      expect(new HttpResponse().setCookies({ foo: 'foo-value', bar: 'bar-value' })).toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        cookies: { foo: 'foo-value', bar: 'bar-value' },
        headers: {},
        statusCode: 200,
      });
    });
  });

  describe('json()', () => {
    it('should create a json response.', () => {
      expect(new HttpResponse().json({ foo: 'bar' })).toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf8'),
        cookies: {},
        headers: { 'Content-Type': 'application/json' },
        statusCode: 200,
      });
    });
  });

  describe('redirect()', () => {
    it('should create a redirect response.', () => {
      expect(new HttpResponse().redirect('https://example.com')).toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: {},
        headers: { Location: 'https://example.com' },
        statusCode: 303,
      });

      expect(new HttpResponse().redirect(new URL('https://example.com'))).toMatchObject<Partial<HttpResponse>>({
        body: Buffer.alloc(0),
        cookies: {},
        headers: { Location: expect.stringContaining('https://example.com') },
        statusCode: 303,
      });
    });
  });

  describe('html()', () => {
    it('should create an html response.', () => {
      expect(new HttpResponse().html('<html></html>')).toMatchObject<Partial<HttpResponse>>({
        body: Buffer.from('<html></html>', 'utf8'),
        cookies: {},
        headers: {},
        statusCode: 200,
      });
    });
  });
});
