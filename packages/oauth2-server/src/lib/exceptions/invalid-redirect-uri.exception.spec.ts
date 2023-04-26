import { InvalidRedirectUriException } from './invalid-redirect-uri.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new invalid redirect uri exception.', () => {
  const exception = new InvalidRedirectUriException({});

  expect(exception.code).toEqual<ErrorCode>('invalid_redirect_uri');
  expect(exception.statusCode).toBe(400);
});
