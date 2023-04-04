import { UnauthorizedClientException } from './unauthorized-client.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new unauthorized client exception.', () => {
  const exception = new UnauthorizedClientException({});

  expect(exception.code).toEqual<ErrorCode>('unauthorized_client');
  expect(exception.statusCode).toBe(400);
});
