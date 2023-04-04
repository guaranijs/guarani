import { ServerErrorException } from './server-error.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new server error exception.', () => {
  const exception = new ServerErrorException({});

  expect(exception.code).toEqual<ErrorCode>('server_error');
  expect(exception.statusCode).toBe(500);
});
