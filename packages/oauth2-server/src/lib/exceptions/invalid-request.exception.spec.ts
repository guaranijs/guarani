import { ErrorCode } from './error-code.enum';
import { InvalidRequestException } from './invalid-request.exception';

test('should instantiate a new invalid request exception.', () => {
  const exception = new InvalidRequestException();

  expect(exception.error).toEqual(ErrorCode.InvalidRequest);
  expect(exception.statusCode).toEqual(400);
});
