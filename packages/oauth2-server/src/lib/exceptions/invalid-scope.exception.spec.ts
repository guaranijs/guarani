import { InvalidScopeException } from './invalid-scope.exception';

test('should instantiate a new invalid scope exception.', () => {
  const exception = new InvalidScopeException({});

  expect(exception.code).toBe('invalid_scope');
  expect(exception.statusCode).toBe(400);
});
