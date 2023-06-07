import { ErrorCode } from './error-code.enum';
import { ExpiredTokenException } from './expired-token.exception';

test('should instantiate a new expired token exception.', () => {
  const exception = new ExpiredTokenException();

  expect(exception.error).toEqual(ErrorCode.ExpiredToken);
  expect(exception.statusCode).toEqual(400);
});
