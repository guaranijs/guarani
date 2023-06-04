import { ErrorCode } from './error-code.enum';
import { UnsupportedResponseTypeException } from './unsupported-response-type.exception';

test('should instantiate a new unsupported response type exception.', () => {
  const exception = new UnsupportedResponseTypeException();

  expect(exception.error).toEqual(ErrorCode.UnsupportedResponseType);
  expect(exception.statusCode).toEqual(400);
});
