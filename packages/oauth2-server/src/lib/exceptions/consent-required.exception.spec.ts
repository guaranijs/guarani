import { ConsentRequiredException } from './consent-required.exception';
import { ErrorCode } from './error-code.enum';

test('should instantiate a new consent required exception.', () => {
  const exception = new ConsentRequiredException({});

  expect(exception.code).toEqual(ErrorCode.ConsentRequired);
  expect(exception.statusCode).toEqual(401);
});
