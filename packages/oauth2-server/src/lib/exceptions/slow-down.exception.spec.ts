import { SlowDownException } from './slow-down.exception';

test('should instantiate a new slow down exception.', () => {
  const exception = new SlowDownException({});

  expect(exception.code).toBe('slow_down');
  expect(exception.statusCode).toBe(400);
});
