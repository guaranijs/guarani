import { OutgoingHttpHeaders } from 'http';

import { OAuth2Exception } from './oauth2.exception';
import { OAuth2ExceptionParameters } from './oauth2.exception.parameters';
import { OAuth2ExceptionResponse } from './oauth2.exception.response';

describe('OAuth 2.0 Exception', () => {
  let parameters: OAuth2ExceptionParameters;

  beforeEach(() => {
    parameters = { description: 'Sample description.' };
  });

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

  it('should add a single entry to the parameters attribute.', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);

    expect(() => exception.setParameter('iss', 'https://server.example.com')).not.toThrow();
    expect(exception['parameters']).toStrictEqual<OAuth2ExceptionParameters>({
      description: 'Sample description.',
      iss: 'https://server.example.com',
    });
  });

  it('should add multiple entries to the parameters attribute.', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);

    expect(() => exception.setParameters({ iss: 'https://server.example.com', state: 'client_state' })).not.toThrow();
    expect(exception['parameters']).toStrictEqual<OAuth2ExceptionParameters>({
      description: 'Sample description.',
      state: 'client_state',
      iss: 'https://server.example.com',
    });
  });

  it('should return a valid oauth 2.0 error parameters object.', () => {
    const exception: OAuth2Exception = Reflect.construct(OAuth2Exception, [parameters]);

    Reflect.set(exception, 'code', 'custom_code');

    expect(exception.toJSON()).toStrictEqual<OAuth2ExceptionResponse>({
      error: <any>'custom_code',
      error_description: 'Sample description.',
    });
  });
});
