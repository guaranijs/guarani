import { ErrorCode } from './error-code.enum';
import { InvalidGrantException } from './invalid-grant.exception';

test('should instantiate a new invalid grant exception.', () => {
  const exception = new InvalidGrantException();

  expect(exception.error).toEqual(ErrorCode.InvalidGrant);
  expect(exception.statusCode).toEqual(400);
});
