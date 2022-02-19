/**
 * Collection of lifecycles supported by the package.
 */
export enum Lifecycle {
  /**
   * Multiple resolutions use the same instance.
   */
  Singleton,

  /**
   * Each resolution creates a new instance.
   */
  Transient,
}
