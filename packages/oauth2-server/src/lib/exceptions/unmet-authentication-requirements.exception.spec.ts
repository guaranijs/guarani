import { ErrorCode } from './error-code.enum';
import { UnmetAuthenticationRequirementsException } from './unmet-authentication-requirements.exception';

test('should instantiate a new unmet authentication requirements exception.', () => {
  const exception = new UnmetAuthenticationRequirementsException();

  expect(exception.error).toEqual(ErrorCode.UnmetAuthenticationRequirements);
  expect(exception.statusCode).toEqual(400);
});
