import { AccessDeniedException } from './access-denied.exception';
import { ErrorCode } from './error-code.enum';

test('should instantiate a new access denied exception.', () => {
  const exception = new AccessDeniedException({});

  expect(exception.code).toEqual(ErrorCode.AccessDenied);
  expect(exception.statusCode).toEqual(400);
});
