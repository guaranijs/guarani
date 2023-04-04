import { UnsupportedResponseTypeException } from './unsupported-response-type.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new unsupported response type exception.', () => {
  const exception = new UnsupportedResponseTypeException({});

  expect(exception.code).toEqual<ErrorCode>('unsupported_response_type');
  expect(exception.statusCode).toBe(400);
});
