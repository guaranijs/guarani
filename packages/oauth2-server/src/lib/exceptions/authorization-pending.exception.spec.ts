import { AuthorizationPendingException } from './authorization-pending.exception';

test('should instantiate a new authorization pending exception.', () => {
  const exception = new AuthorizationPendingException({});

  expect(exception.code).toBe('authorization_pending');
  expect(exception.statusCode).toBe(400);
});
