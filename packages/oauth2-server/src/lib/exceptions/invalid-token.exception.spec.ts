import { ErrorCode } from './error-code.enum';
import { InvalidTokenException } from './invalid-token.exception';

test('should instantiate a new invalid token exception.', () => {
  const exception = new InvalidTokenException({});

  expect(exception.code).toEqual(ErrorCode.InvalidToken);
  expect(exception.statusCode).toEqual(401);
});
