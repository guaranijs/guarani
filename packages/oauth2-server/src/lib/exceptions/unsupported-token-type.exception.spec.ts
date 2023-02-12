import { UnsupportedTokenTypeException } from './unsupported-token-type.exception';

test('should instantiate a new unsupported token type exception.', () => {
  const exception = new UnsupportedTokenTypeException({});

  expect(exception.code).toBe('unsupported_token_type');
  expect(exception.statusCode).toBe(400);
});
