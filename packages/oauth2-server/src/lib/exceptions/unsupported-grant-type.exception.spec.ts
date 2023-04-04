import { UnsupportedGrantTypeException } from './unsupported-grant-type.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new unsupported grant type exception.', () => {
  const exception = new UnsupportedGrantTypeException({});

  expect(exception.code).toEqual<ErrorCode>('unsupported_grant_type');
  expect(exception.statusCode).toBe(400);
});
