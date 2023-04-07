import { ErrorCode } from './error-code.type';
import { InvalidTokenException } from './invalid-token.exception';

test('should instantiate a new invalid token exception.', () => {
  const exception = new InvalidTokenException({});

  expect(exception.code).toEqual<ErrorCode>('invalid_token');
  expect(exception.statusCode).toBe(401);
});
