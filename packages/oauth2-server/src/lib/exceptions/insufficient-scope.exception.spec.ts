import { ErrorCode } from './error-code.type';
import { InsufficientScopeException } from './insufficient-scope.exception';

test('should instantiate a new insufficient scope exception.', () => {
  const exception = new InsufficientScopeException({});

  expect(exception.code).toEqual<ErrorCode>('insufficient_scope');
  expect(exception.statusCode).toBe(403);
});
