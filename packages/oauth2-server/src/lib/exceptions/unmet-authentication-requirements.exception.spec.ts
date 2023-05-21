import { ErrorCode } from './error-code.type';
import { UnmetAuthenticationRequirementsException } from './unmet-authentication-requirements.exception';

test('should instantiate a new unmet authentication requirements exception.', () => {
  const exception = new UnmetAuthenticationRequirementsException({});

  expect(exception.code).toEqual<ErrorCode>('unmet_authentication_requirements');
  expect(exception.statusCode).toBe(400);
});
