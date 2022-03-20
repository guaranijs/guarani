import { JoseException } from './jose.exception';

/**
 * Raised when the requested JSON Web Key is not registered at the JSON Web Key Set.
 */
export class JsonWebKeyNotFoundException extends JoseException {
  /**
   * Returns the default Error Message of the JOSE Exception.
   */
  protected getDefaultMessage(): string {
    return 'The requested JSON Web Key is not registered at the JSON Web Key Set.';
  }
}
