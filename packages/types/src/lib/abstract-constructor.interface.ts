/**
 * Denotes the Abstract Constructor Type of the provided Generic.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export interface AbstractConstructor<T> extends Function {
  /**
   * Prototype of the Constructor Type.
   */
  readonly prototype: T;
}
