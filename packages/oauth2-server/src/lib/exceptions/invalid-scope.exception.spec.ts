import { ErrorCode } from './error-code.enum';
import { InvalidScopeException } from './invalid-scope.exception';

test('should instantiate a new invalid scope exception.', () => {
  const exception = new InvalidScopeException({});

  expect(exception.code).toEqual(ErrorCode.InvalidScope);
  expect(exception.statusCode).toEqual(400);
});
