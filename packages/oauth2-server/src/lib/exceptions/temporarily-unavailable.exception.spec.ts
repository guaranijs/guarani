import { ErrorCode } from './error-code.enum';
import { TemporarilyUnavailableException } from './temporarily-unavailable.exception';

test('should instantiate a new temporarily unavailable exception.', () => {
  const exception = new TemporarilyUnavailableException({});

  expect(exception.code).toEqual(ErrorCode.TemporarilyUnavailable);
  expect(exception.statusCode).toEqual(503);
});
