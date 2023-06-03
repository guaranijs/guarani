import { ErrorCode } from './error-code.enum';
import { SlowDownException } from './slow-down.exception';

test('should instantiate a new slow down exception.', () => {
  const exception = new SlowDownException({});

  expect(exception.code).toEqual(ErrorCode.SlowDown);
  expect(exception.statusCode).toEqual(400);
});
