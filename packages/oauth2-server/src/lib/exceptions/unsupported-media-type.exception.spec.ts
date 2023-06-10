import { ErrorCode } from './error-code.enum';
import { UnsupportedMediaTypeException } from './unsupported-media-type.exception';

test('should instantiate a new unsupported media type exception.', () => {
  const exception = new UnsupportedMediaTypeException();

  expect(exception.error).toEqual(ErrorCode.UnsupportedMediaType);
  expect(exception.statusCode).toEqual(415);
});
