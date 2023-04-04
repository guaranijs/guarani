import { AuthorizationPendingException } from './authorization-pending.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new authorization pending exception.', () => {
  const exception = new AuthorizationPendingException({});

  expect(exception.code).toEqual<ErrorCode>('authorization_pending');
  expect(exception.statusCode).toBe(400);
});
