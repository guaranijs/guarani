import { JoseException } from './jose.exception';

/**
 * Raised when the provided JSON Web Token is invalid.
 */
export class ExpiredJsonWebTokenException extends JoseException {
  /**
   * Instantiates a new Expired JSON Web Token Exception.
   *
   * @param message Error Message.
   */
  public constructor(message = 'The provided JSON Web Token is expired.') {
    super(message);
  }
}
