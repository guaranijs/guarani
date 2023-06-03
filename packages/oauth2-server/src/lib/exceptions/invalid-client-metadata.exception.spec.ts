import { ErrorCode } from './error-code.enum';
import { InvalidClientMetadataException } from './invalid-client-metadata.exception';

test('should instantiate a new invalid client metadata exception.', () => {
  const exception = new InvalidClientMetadataException({});

  expect(exception.code).toEqual(ErrorCode.InvalidClientMetadata);
  expect(exception.statusCode).toEqual(400);
});
