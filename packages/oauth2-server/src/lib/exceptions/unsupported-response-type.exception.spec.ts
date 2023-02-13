import { UnsupportedResponseTypeException } from './unsupported-response-type.exception';

test('should instantiate a new unsupported response type exception.', () => {
  const exception = new UnsupportedResponseTypeException({});

  expect(exception.code).toBe('unsupported_response_type');
  expect(exception.statusCode).toBe(400);
});
