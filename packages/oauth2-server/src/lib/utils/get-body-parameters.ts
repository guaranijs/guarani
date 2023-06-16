import { UnsupportedMediaTypeException } from '../exceptions/unsupported-media-type.exception';
import { HttpRequest } from '../http/http.request';

/**
 * Parses the Body of the Http Request based on the **Content-Type** Http Header and returns its value.
 *
 * @param request Http Request.
 * @returns Parameters of the Body of the Http Request.
 */
export function getBodyParameters<T = unknown>(request: HttpRequest): T {
  switch (request.headers['content-type']) {
    case 'application/x-www-form-urlencoded':
      return request.form() as T;

    case 'application/json':
      return request.json() as T;

    default:
      throw new UnsupportedMediaTypeException(`Unexpected Content Type "${request.headers['content-type']}".`);
  }
}
