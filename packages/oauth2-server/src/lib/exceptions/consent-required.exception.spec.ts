import { ConsentRequiredException } from './consent-required.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new consent required exception.', () => {
  const exception = new ConsentRequiredException({});

  expect(exception.code).toEqual<ErrorCode>('consent_required');
  expect(exception.statusCode).toBe(401);
});
