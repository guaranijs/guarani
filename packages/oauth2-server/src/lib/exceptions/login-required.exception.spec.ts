import { ErrorCode } from './error-code.enum';
import { LoginRequiredException } from './login-required.exception';

test('should instantiate a new login required exception.', () => {
  const exception = new LoginRequiredException();

  expect(exception.error).toEqual(ErrorCode.LoginRequired);
  expect(exception.statusCode).toEqual(401);
});
