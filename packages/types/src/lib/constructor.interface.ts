/**
 * Denotes the Constructor Type of the provided Generic.
 */
export interface Constructor<T> extends Function {
  /**
   * Signature of the Constructor Type's constructor method.
   */
  new (...args: any[]): T;

  /**
   * Prototype of the Constructor Type.
   */
  readonly prototype: T;
}
