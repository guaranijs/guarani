import { InvalidClientException } from './invalid-client.exception';

test('should instantiate a new invalid client exception.', () => {
  const exception = new InvalidClientException({});

  expect(exception.code).toBe('invalid_client');
  expect(exception.statusCode).toBe(401);
});
