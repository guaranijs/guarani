import { ErrorCode } from './error-code.enum';
import { InvalidClientException } from './invalid-client.exception';

test('should instantiate a new invalid client exception.', () => {
  const exception = new InvalidClientException({});

  expect(exception.code).toEqual(ErrorCode.InvalidClient);
  expect(exception.statusCode).toEqual(401);
});
