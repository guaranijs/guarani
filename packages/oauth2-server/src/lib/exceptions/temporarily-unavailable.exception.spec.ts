import { TemporarilyUnavailableException } from './temporarily-unavailable.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new temporarily unavailable exception.', () => {
  const exception = new TemporarilyUnavailableException({});

  expect(exception.code).toEqual<ErrorCode>('temporarily_unavailable');
  expect(exception.statusCode).toBe(503);
});
