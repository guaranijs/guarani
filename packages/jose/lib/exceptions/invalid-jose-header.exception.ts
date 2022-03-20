import { JoseException } from './jose.exception';

/**
 * Raised when the provided JOSE Header is invalid.
 */
export class InvalidJoseHeaderException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided JOSE Header is invalid.';
  }
}
