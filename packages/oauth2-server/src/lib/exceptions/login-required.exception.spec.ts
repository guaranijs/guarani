import { LoginRequiredException } from './login-required.exception';

test('should instantiate a new login required exception.', () => {
  const exception = new LoginRequiredException({});

  expect(exception.code).toBe('login_required');
  expect(exception.statusCode).toBe(401);
});
