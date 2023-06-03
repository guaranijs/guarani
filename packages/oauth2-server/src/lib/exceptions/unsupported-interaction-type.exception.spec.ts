import { ErrorCode } from './error-code.enum';
import { UnsupportedInteractionTypeException } from './unsupported-interaction-type.exception';

test('should instantiate a new unsupported interaction type exception.', () => {
  const exception = new UnsupportedInteractionTypeException({});

  expect(exception.code).toEqual(ErrorCode.UnsupportedInteractionType);
  expect(exception.statusCode).toEqual(400);
});
