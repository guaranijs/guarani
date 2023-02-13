import { TemporarilyUnavailableException } from './temporarily-unavailable.exception';

test('should instantiate a new temporarily unavailable exception.', () => {
  const exception = new TemporarilyUnavailableException({});

  expect(exception.code).toBe('temporarily_unavailable');
  expect(exception.statusCode).toBe(503);
});
