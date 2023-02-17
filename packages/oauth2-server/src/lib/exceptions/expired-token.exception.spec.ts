import { ExpiredTokenException } from './expired-token.exception';

test('should instantiate a new expired token exception.', () => {
  const exception = new ExpiredTokenException({});

  expect(exception.code).toBe('expired_token');
  expect(exception.statusCode).toBe(400);
});
