import { ConsentRequiredException } from './consent-required.exception';

test('should instantiate a new consent required exception.', () => {
  const exception = new ConsentRequiredException({});

  expect(exception.code).toBe('consent_required');
  expect(exception.statusCode).toBe(401);
});
