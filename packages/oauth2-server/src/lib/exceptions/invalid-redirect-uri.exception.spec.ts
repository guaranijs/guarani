import { ErrorCode } from './error-code.enum';
import { InvalidRedirectUriException } from './invalid-redirect-uri.exception';

test('should instantiate a new invalid redirect uri exception.', () => {
  const exception = new InvalidRedirectUriException();

  expect(exception.error).toEqual(ErrorCode.InvalidRedirectUri);
  expect(exception.statusCode).toEqual(400);
});
