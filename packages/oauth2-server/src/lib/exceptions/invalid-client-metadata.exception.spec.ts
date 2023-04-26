import { InvalidClientMetadataException } from './invalid-client-metadata.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new invalid client metadata exception.', () => {
  const exception = new InvalidClientMetadataException({});

  expect(exception.code).toEqual<ErrorCode>('invalid_client_metadata');
  expect(exception.statusCode).toBe(400);
});
