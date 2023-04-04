import { UnsupportedInteractionTypeException } from './unsupported-interaction-type.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new unsupported interaction type exception.', () => {
  const exception = new UnsupportedInteractionTypeException({});

  expect(exception.code).toEqual<ErrorCode>('unsupported_interaction_type');
  expect(exception.statusCode).toBe(400);
});
