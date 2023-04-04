import { UnsupportedTokenTypeException } from './unsupported-token-type.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new unsupported token type exception.', () => {
  const exception = new UnsupportedTokenTypeException({});

  expect(exception.code).toEqual<ErrorCode>('unsupported_token_type');
  expect(exception.statusCode).toBe(400);
});
