import { ErrorCode } from './error-code.enum';
import { UnauthorizedClientException } from './unauthorized-client.exception';

test('should instantiate a new unauthorized client exception.', () => {
  const exception = new UnauthorizedClientException({});

  expect(exception.code).toEqual(ErrorCode.UnauthorizedClient);
  expect(exception.statusCode).toEqual(400);
});
