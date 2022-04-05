import { JoseException } from './jose.exception';

/**
 * Raised when the provided algorithm in not supported.
 */
export class UnsupportedAlgorithmException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided algorithm is currently not supported.';
  }
}
