import { AccessDeniedException } from './access-denied.exception';

test('should instantiate a new access denied exception.', () => {
  const exception = new AccessDeniedException({});

  expect(exception.code).toBe('access_denied');
  expect(exception.statusCode).toBe(400);
});
