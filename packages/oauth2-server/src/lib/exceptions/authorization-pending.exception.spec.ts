import { AuthorizationPendingException } from './authorization-pending.exception';
import { ErrorCode } from './error-code.enum';

test('should instantiate a new authorization pending exception.', () => {
  const exception = new AuthorizationPendingException({});

  expect(exception.code).toEqual(ErrorCode.AuthorizationPending);
  expect(exception.statusCode).toEqual(400);
});
