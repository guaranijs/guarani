import { InvalidGrantException } from './invalid-grant.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new invalid grant exception.', () => {
  const exception = new InvalidGrantException({});

  expect(exception.code).toEqual<ErrorCode>('invalid_grant');
  expect(exception.statusCode).toBe(400);
});
