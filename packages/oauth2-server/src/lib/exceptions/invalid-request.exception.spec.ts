import { InvalidRequestException } from './invalid-request.exception';

test('should instantiate a new invalid request exception.', () => {
  const exception = new InvalidRequestException({});

  expect(exception.code).toBe('invalid_request');
  expect(exception.statusCode).toBe(400);
});
