import { UnsupportedInteractionTypeException } from './unsupported-interaction-type.exception';

test('should instantiate a new unsupported interaction type exception.', () => {
  const exception = new UnsupportedInteractionTypeException({});

  expect(exception.code).toBe('unsupported_interaction_type');
  expect(exception.statusCode).toBe(400);
});
