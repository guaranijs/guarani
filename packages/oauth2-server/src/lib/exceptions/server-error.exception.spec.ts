import { ErrorCode } from './error-code.enum';
import { ServerErrorException } from './server-error.exception';

test('should instantiate a new server error exception.', () => {
  const exception = new ServerErrorException();

  expect(exception.error).toEqual(ErrorCode.ServerError);
  expect(exception.statusCode).toEqual(500);
});
