import { ErrorCode } from './error-code.enum';
import { UnsupportedGrantTypeException } from './unsupported-grant-type.exception';

test('should instantiate a new unsupported grant type exception.', () => {
  const exception = new UnsupportedGrantTypeException();

  expect(exception.error).toEqual(ErrorCode.UnsupportedGrantType);
  expect(exception.statusCode).toEqual(400);
});
