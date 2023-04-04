import { InvalidRequestException } from './invalid-request.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new invalid request exception.', () => {
  const exception = new InvalidRequestException({});

  expect(exception.code).toEqual<ErrorCode>('invalid_request');
  expect(exception.statusCode).toBe(400);
});
