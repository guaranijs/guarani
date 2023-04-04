import { InvalidScopeException } from './invalid-scope.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new invalid scope exception.', () => {
  const exception = new InvalidScopeException({});

  expect(exception.code).toEqual<ErrorCode>('invalid_scope');
  expect(exception.statusCode).toBe(400);
});
