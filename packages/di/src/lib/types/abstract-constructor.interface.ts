/**
 * Denotes the Abstract Constructor Type of the provided Generic.
 */
export interface AbstractConstructor<T> extends Function {
  /**
   * Prototype of the Constructor Type.
   */
  readonly prototype: T;
}
