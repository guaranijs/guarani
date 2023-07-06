import { JoseException } from './jose.exception';

/**
 * Raised when no JSON Web Key matches the criteria at the JSON Web Key Set.
 */
export class JsonWebKeyNotFoundException extends JoseException {
  /**
   * Instantiates a new JSON Web Key Not Found Exception.
   *
   * @param message Error Message.
   */
  public constructor(
    message = 'No JSON Web Key matches the criteria at the JSON Web Key Set.',
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
