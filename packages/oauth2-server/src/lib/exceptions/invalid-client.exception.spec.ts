import { InvalidClientException } from './invalid-client.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new invalid client exception.', () => {
  const exception = new InvalidClientException({});

  expect(exception.code).toEqual<ErrorCode>('invalid_client');
  expect(exception.statusCode).toBe(401);
});
