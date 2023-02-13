import { UnauthorizedClientException } from './unauthorized-client.exception';

test('should instantiate a new unauthorized client exception.', () => {
  const exception = new UnauthorizedClientException({});

  expect(exception.code).toBe('unauthorized_client');
  expect(exception.statusCode).toBe(400);
});
