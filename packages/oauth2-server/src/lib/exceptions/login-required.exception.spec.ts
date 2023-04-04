import { LoginRequiredException } from './login-required.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new login required exception.', () => {
  const exception = new LoginRequiredException({});

  expect(exception.code).toEqual<ErrorCode>('login_required');
  expect(exception.statusCode).toBe(401);
});
