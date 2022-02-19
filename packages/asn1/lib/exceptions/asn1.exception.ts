import { Optional } from '@guarani/types';

/**
 * Base error class for ASN.1 exceptions.
 */
export class Asn1Exception extends Error {
  /**
   * Instantiates a new Asn1Exception and correctly sets the name of the Error.
   *
   * @param message Error message to be displayed.
   */
  public constructor(message?: Optional<string>) {
    super(message);
    this.name = this.constructor.name;
  }
}
