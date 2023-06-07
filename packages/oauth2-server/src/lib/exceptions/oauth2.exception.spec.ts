import { OutgoingHttpHeaders } from 'http';

import { OAuth2Exception } from './oauth2.exception';
import { OAuth2ExceptionResponse } from './oauth2.exception.response';

const invalidConstructorDescriptions: any[] = [true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

const invalidHeaderNames: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidHeaderValues: any[] = [
  undefined,
  null,
  true,
  1n,
  Symbol('a'),
  Buffer,
  () => 1,
  {},
  [],
  [undefined],
  [null],
  [true],
  [1],
  [1.2],
  [1n],
  [Symbol('a')],
  [Buffer],
  [() => 1],
  [{}],
  [[]],
];

const invalidHeaderObjects: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, () => 1, []];

const invalidDescriptions: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidUris: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

describe('OAuth 2.0 Exception', () => {
  describe('constructor', () => {
    it.each(invalidConstructorDescriptions)('should throw when providing an invalid description.', (description) => {
      expect(() => Reflect.construct(OAuth2Exception, [description])).toThrowWithMessage(
        TypeError,
        'Invalid parameter "description".'
      );
    });

    it('should instantiate a new oauth 2.0 exception with a null description.', () => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, []),
        { error: 'lorem_ipsum' }
      );

      expect(exception.message).toBeEmpty();
      expect(exception.statusCode).toEqual(400);
      expect(exception.headers).toStrictEqual<OutgoingHttpHeaders>({});
      expect(exception.toJSON()).toStrictEqual<OAuth2ExceptionResponse>({
        error: 'lorem_ipsum',
        error_description: undefined,
        error_uri: undefined,
      });
    });

    it('should instantiate a new oauth 2.0 exception with a null description.', () => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, [null]),
        { error: 'lorem_ipsum' }
      );

      expect(exception.message).toBeEmpty();
      expect(exception.statusCode).toEqual(400);
      expect(exception.headers).toStrictEqual<OutgoingHttpHeaders>({});
      expect(exception.toJSON()).toStrictEqual<OAuth2ExceptionResponse>({
        error: 'lorem_ipsum',
        error_description: undefined,
        error_uri: undefined,
      });
    });

    it('should instantiate a new oauth 2.0 exception with the provided description.', () => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      expect(exception.message).toEqual('Lorem ipsum dolor sit amet...');
      expect(exception.statusCode).toEqual(400);
      expect(exception.headers).toStrictEqual<OutgoingHttpHeaders>({});
      expect(exception.toJSON()).toStrictEqual<OAuth2ExceptionResponse>({
        error: 'lorem_ipsum',
        error_description: 'Lorem ipsum dolor sit amet...',
        error_uri: undefined,
      });
    });
  });

  describe('setHeader()', () => {
    it.each(invalidHeaderNames)('should throw when providing an invalid header name.', (header) => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      expect(() => exception.setHeader(header, 'custom-header-value')).toThrowWithMessage(
        TypeError,
        'Invalid parameter "header".'
      );
    });

    it.each(invalidHeaderValues)('should throw when providing an invalid header name.', (value) => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      expect(() => exception.setHeader('x-custom', value)).toThrowWithMessage(TypeError, 'Invalid parameter "value".');
    });

    it('should add a single entry to the headers attribute.', () => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      exception.setHeader('x-custom', 'custom-header-value');
      expect(exception.headers).toStrictEqual<OutgoingHttpHeaders>({ 'x-custom': 'custom-header-value' });
    });
  });

  describe('setHeaders()', () => {
    it.each(invalidHeaderObjects)('should throw when providing an invalid headers object.', (headers) => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      expect(() => exception.setHeaders(headers)).toThrowWithMessage(TypeError, 'Invalid parameter "headers".');
    });

    it.each(invalidHeaderValues)('should throw when providing a headers object with invalid values.', (value) => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      expect(() => exception.setHeaders({ 'x-custom': value })).toThrowWithMessage(
        TypeError,
        'Invalid parameter "headers".'
      );
    });

    it('should add multiple entries to the headers attribute.', () => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      exception.setHeaders({ 'x-foo': 'foo', 'x-bar': 'bar' });
      expect(exception.headers).toStrictEqual<OutgoingHttpHeaders>({ 'x-foo': 'foo', 'x-bar': 'bar' });
    });
  });

  describe('setDescription()', () => {
    it.each(invalidDescriptions)('should throw when providing an invalid description.', (description) => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      expect(() => exception.setDescription(description)).toThrowWithMessage(
        TypeError,
        'Invalid parameter "description".'
      );
    });

    it('should set the description of the oauth 2.0 exception.', () => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      expect(exception.message).toEqual('Lorem ipsum dolor sit amet...');
      expect(exception.toJSON()).toStrictEqual<OAuth2ExceptionResponse>({
        error: 'lorem_ipsum',
        error_description: 'Lorem ipsum dolor sit amet...',
        error_uri: undefined,
      });

      exception.setDescription('Changed lorem ipsum.');

      expect(exception.message).toEqual('Changed lorem ipsum.');
      expect(exception.toJSON()).toStrictEqual<OAuth2ExceptionResponse>({
        error: 'lorem_ipsum',
        error_description: 'Changed lorem ipsum.',
        error_uri: undefined,
      });
    });
  });

  describe('setUri()', () => {
    it.each(invalidUris)('should throw when providing an invalid uri.', (uri) => {
      const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
        { error: 'lorem_ipsum' }
      );

      expect(() => exception.setUri(uri)).toThrowWithMessage(TypeError, 'Invalid parameter "uri".');
    });

    const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
      Reflect.construct(OAuth2Exception, ['Lorem ipsum dolor sit amet...']),
      { error: 'lorem_ipsum' }
    );

    expect(exception.toJSON()).toStrictEqual<OAuth2ExceptionResponse>({
      error: 'lorem_ipsum',
      error_description: 'Lorem ipsum dolor sit amet...',
      error_uri: undefined,
    });

    exception.setUri('https://server.example.com/docs/oidc/lorem_ipsum');

    expect(exception.toJSON()).toStrictEqual<OAuth2ExceptionResponse>({
      error: 'lorem_ipsum',
      error_description: 'Lorem ipsum dolor sit amet...',
      error_uri: 'https://server.example.com/docs/oidc/lorem_ipsum',
    });
  });
});
