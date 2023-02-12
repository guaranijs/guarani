import { UnsupportedGrantTypeException } from './unsupported-grant-type.exception';

test('should instantiate a new unsupported grant type exception.', () => {
  const exception = new UnsupportedGrantTypeException({});

  expect(exception.code).toBe('unsupported_grant_type');
  expect(exception.statusCode).toBe(400);
});
