import { OutgoingHttpHeaders } from 'http';

import { OAuth2Exception } from './oauth2.exception';
import { OAuth2ExceptionParameters } from './oauth2.exception.parameters';

const parameters: OAuth2ExceptionParameters = { description: 'Sample description.' };

describe('OAuth 2.0 Exception', () => {
  it('should instantiate a new oauth 2.0 exception.', () => {
    expect(Reflect.construct(OAuth2Exception, [parameters])).toBeDefined();
  });

  it('should set the "error_description" parameter as the error\'s "message".', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);
    expect(exception.message).toBe('Sample description.');
  });

  it('should set the constructor\'s "parameters" as the exception\'s "parameters" attribute.', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);
    expect(exception['parameters']).toStrictEqual(parameters);
  });

  it('should have 400 as the default http status code.', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);
    expect(exception.statusCode).toBe(400);
  });

  it('should have an empty object as the default http headers.', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);
    expect(exception.headers).toStrictEqual<OutgoingHttpHeaders>({});
  });

  it('should add a single entry to the headers attribute.', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);

    expect(() => exception.setHeader('x-custom', 'custom-header-value')).not.toThrow();
    expect(exception.headers).toStrictEqual<OutgoingHttpHeaders>({ 'x-custom': 'custom-header-value' });
  });

  it('should add multiple entries to the headers attribute.', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);

    expect(() => exception.setHeaders({ 'x-foo': 'foo', 'x-bar': 'bar' })).not.toThrow();
    expect(exception.headers).toStrictEqual<OutgoingHttpHeaders>({ 'x-foo': 'foo', 'x-bar': 'bar' });
  });

  it('should return a valid oauth 2.0 error parameters object.', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);

    Reflect.set(exception, 'code', 'custom_code');

    expect(exception.toJSON()).toStrictEqual<Record<string, any>>({
      error: 'custom_code',
      error_description: 'Sample description.',
      error_uri: undefined,
      state: undefined,
    });
  });
});