import { SlowDownException } from './slow-down.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new slow down exception.', () => {
  const exception = new SlowDownException({});

  expect(exception.code).toEqual<ErrorCode>('slow_down');
  expect(exception.statusCode).toBe(400);
});
