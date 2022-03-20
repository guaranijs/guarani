import { JoseException } from './jose.exception';

/**
 * Raised when the provided signature does not match the provided message.
 */
export class InvalidSignatureException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The provided signature does not match the provided message.';
  }
}
