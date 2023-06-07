import { ErrorCode } from './error-code.enum';
import { InsufficientScopeException } from './insufficient-scope.exception';

test('should instantiate a new insufficient scope exception.', () => {
  const exception = new InsufficientScopeException();

  expect(exception.error).toEqual(ErrorCode.InsufficientScope);
  expect(exception.statusCode).toEqual(403);
});
