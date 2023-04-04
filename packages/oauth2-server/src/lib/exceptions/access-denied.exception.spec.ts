import { AccessDeniedException } from './access-denied.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new access denied exception.', () => {
  const exception = new AccessDeniedException({});

  expect(exception.code).toEqual<ErrorCode>('access_denied');
  expect(exception.statusCode).toBe(400);
});
