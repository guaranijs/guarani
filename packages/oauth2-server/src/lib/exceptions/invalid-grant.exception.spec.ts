import { InvalidGrantException } from './invalid-grant.exception';

test('should instantiate a new invalid grant exception.', () => {
  const exception = new InvalidGrantException({});

  expect(exception.code).toBe('invalid_grant');
  expect(exception.statusCode).toBe(400);
});
