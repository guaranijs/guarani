import { ErrorCode } from './error-code.enum';
import { UnsupportedTokenTypeException } from './unsupported-token-type.exception';

test('should instantiate a new unsupported token type exception.', () => {
  const exception = new UnsupportedTokenTypeException({});

  expect(exception.code).toEqual(ErrorCode.UnsupportedTokenType);
  expect(exception.statusCode).toEqual(400);
});
