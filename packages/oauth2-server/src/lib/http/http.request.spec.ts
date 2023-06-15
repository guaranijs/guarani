import { Buffer } from 'buffer';
import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { Dictionary, Json, OneOrMany } from '@guarani/types';

import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedMediaTypeException } from '../exceptions/unsupported-media-type.exception';
import { HttpRequest } from './http.request';
import { HttpRequestParameters } from './http-request.parameters';

const invalidHttpMethods: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

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
  describe('constructor', () => {
    it.each(invalidHttpMethods)('should throw when providing an invalid http method.', (method) => {
      expect(() => new HttpRequest(<HttpRequestParameters>{ method })).toThrowWithMessage(
        TypeError,
        'Invalid Http Method.'
      );
    });

    it.each(unsupportedHttpMethods)('should throw when providing an unsupported http method.', (method) => {
      expect(() => new HttpRequest(<HttpRequestParameters>{ method })).toThrowWithMessage(
        TypeError,
        `Unsupported Http Method "${method}".`
      );
    });

    it('should return a valid http delete request.', () => {
      const parameters: HttpRequestParameters = {
        method: 'DELETE',
        url: new URL('https://server.example.com/p/a/t/h?entity_id=entity_id'),
        headers: { origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
        body: Buffer.alloc(0),
      };

      const request = new HttpRequest(parameters);

      expect(request).toMatchObject<Partial<HttpRequest>>({
        method: 'DELETE',
        path: '/p/a/t/h',
        query: { entity_id: 'entity_id' },
        headers: { origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
      });
    });

    it('should return a valid http get request.', () => {
      const parameters: HttpRequestParameters = {
        method: 'GET',
        url: new URL('https://server.example.com/p/a/t/h?foo=foo&bar=bar'),
        headers: { origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
        body: Buffer.alloc(0),
      };

      const request = new HttpRequest(parameters);

      expect(request).toMatchObject<Partial<HttpRequest>>({
        method: 'GET',
        path: '/p/a/t/h',
        query: { foo: 'foo', bar: 'bar' },
        headers: { origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
      });
    });

    it('should return a valid http post request.', () => {
      const parameters: HttpRequestParameters = {
        method: 'POST',
        url: new URL('https://server.example.com/p/a/t/h'),
        headers: { 'content-type': 'application/json', origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
        body: Buffer.from(JSON.stringify({ foo: 'foo', bar: 'bar' }), 'utf8'),
      };

      const request = new HttpRequest(parameters);

      expect(request).toMatchObject<Partial<HttpRequest>>({
        method: 'POST',
        path: '/p/a/t/h',
        query: {},
        headers: { 'content-type': 'application/json', origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
      });
    });

    it('should return a valid http put request.', () => {
      const parameters: HttpRequestParameters = {
        method: 'PUT',
        url: new URL('https://server.example.com/p/a/t/h?entity_id=entity_id'),
        headers: { 'content-type': 'application/json', origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
        body: Buffer.from(JSON.stringify({ foo: 'foo', bar: 'bar' }), 'utf8'),
      };

      const request = new HttpRequest(parameters);

      expect(request).toMatchObject<Partial<HttpRequest>>({
        method: 'PUT',
        path: '/p/a/t/h',
        query: { entity_id: 'entity_id' },
        headers: { 'content-type': 'application/json', origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
      });
    });
  });

  describe('form()', () => {
    it('should throw when the http header "content-type" is not "application/x-www-form-urlencoded".', () => {
      const data: Json = { foo: 'foo', bar: 'bar' };

      const parameters: HttpRequestParameters = {
        method: 'POST',
        url: new URL('https://server.example.com/p/a/t/h'),
        headers: { 'content-type': 'application/json', origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
        body: Buffer.from(JSON.stringify(data), 'utf8'),
      };

      const request = new HttpRequest(parameters);

      expect(() => request.form()).toThrowWithMessage(
        UnsupportedMediaTypeException,
        'Unexpected Content Type "application/json".'
      );
    });

    it('should return the parsed body of the http request.', () => {
      const data: Dictionary<OneOrMany<string>> = { foo: 'foo', bar: 'bar' };

      const parameters: HttpRequestParameters = {
        method: 'POST',
        url: new URL('https://server.example.com/p/a/t/h'),
        headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
        body: Buffer.from(stringifyQs(data), 'utf8'),
      };

      const request = new HttpRequest(parameters);
      const body = request.form();

      expect(body).toStrictEqual<Dictionary<OneOrMany<string>>>({
        foo: 'foo',
        bar: 'bar',
      });
    });
  });

  describe('json()', () => {
    it('should throw when the http header "content-type" is not "application/json".', () => {
      const data: Dictionary<OneOrMany<string>> = { foo: 'foo', bar: 'bar' };

      const parameters: HttpRequestParameters = {
        method: 'POST',
        url: new URL('https://server.example.com/p/a/t/h'),
        headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
        body: Buffer.from(stringifyQs(data), 'utf8'),
      };

      const request = new HttpRequest(parameters);

      expect(() => request.json()).toThrowWithMessage(
        UnsupportedMediaTypeException,
        'Unexpected Content Type "application/x-www-form-urlencoded".'
      );
    });

    it('should throw when the body of the http request is an invalid json object.', () => {
      const parameters: HttpRequestParameters = {
        method: 'POST',
        url: new URL('https://server.example.com/p/a/t/h'),
        headers: { 'content-type': 'application/json', origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
        body: Buffer.from('undefined', 'utf8'),
      };

      const request = new HttpRequest(parameters);

      expect(() => request.json()).toThrowWithMessage(
        InvalidRequestException,
        'The Http Request Body is not a valid JSON object.'
      );
    });

    it('should return the parsed body of the http request.', () => {
      const data: Json = { foo: 'foo', bar: 'bar' };

      const parameters: HttpRequestParameters = {
        method: 'POST',
        url: new URL('https://server.example.com/p/a/t/h'),
        headers: { 'content-type': 'application/json', origin: 'server.example.com' },
        cookies: { guarani: 'guarani_cookie' },
        body: Buffer.from(JSON.stringify(data), 'utf8'),
      };

      const request = new HttpRequest(parameters);
      const body = request.json();

      expect(body).toStrictEqual(data);
    });
  });
});
