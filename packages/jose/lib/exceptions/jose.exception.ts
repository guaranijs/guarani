import { Optional } from '@guarani/types';

/**
 * Base error class for the exceptions of the JOSE implementation.
 */
export class JoseException extends Error {
  /**
   * Instantiates a new JOSE Exception.
   *
   * @param message Message describing the error.
   */
  constructor(message?: Optional<string>) {
    super(message);
    this.name = this.constructor.name;
  }
}
