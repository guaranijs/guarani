import { ExpiredTokenException } from './expired-token.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new expired token exception.', () => {
  const exception = new ExpiredTokenException({});

  expect(exception.code).toEqual<ErrorCode>('expired_token');
  expect(exception.statusCode).toBe(400);
});
