import { ServerErrorException } from './server-error.exception';

test('should instantiate a new server error exception.', () => {
  const exception = new ServerErrorException({});

  expect(exception.code).toBe('server_error');
  expect(exception.statusCode).toBe(500);
});
