import { URL } from 'url';

import { Dictionary, Json, OneOrMany } from '@guarani/types';

import { UnsupportedMediaTypeException } from '../exceptions/unsupported-media-type.exception';
import { HttpRequest } from '../http/http.request';
import { getBodyParameters } from './get-body-parameters';

describe('getBodyParameters()', () => {
  it('should throw when the http header "content-type" contains an unsupported media type.', () => {
    const request = new HttpRequest({
      body: {},
      cookies: {},
      headers: { 'content-type': 'application/octet-stream' },
      method: 'POST',
      url: new URL('https://server.example.com/oauth/token'),
    });

    expect(() => getBodyParameters(request)).toThrowWithMessage(
      UnsupportedMediaTypeException,
      'Unexpected Content Type "application/octet-stream".'
    );
  });

  it('should return the http request body as "application/x-www-form-urlencoded', () => {
    const data: Dictionary<OneOrMany<string>> = { foo: 'foo', bar: 'bar' };

    const request = new HttpRequest({
      body: data,
      cookies: {},
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      method: 'POST',
      url: new URL('https://server.example.com/oauth/token'),
    });

    expect(getBodyParameters(request)).toStrictEqual(data);
  });

  it('should return the http request body as "application/json', () => {
    const data: Json = { foo: 'foo', bar: 'bar' };

    const request = new HttpRequest({
      body: data,
      cookies: {},
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      url: new URL('https://server.example.com/oauth/token'),
    });

    expect(getBodyParameters(request)).toStrictEqual(data);
  });
});
