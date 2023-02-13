/**
 * Scope of the resolution of a Token.
 */
export enum Lifecycle {
  /**
   * All resolutions will use the same instance.
   *
   * *Note: This is the default Lifecycle when none is provided.*
   */
  Singleton = 'Singleton',

  /**
   * All requests of a single resolution chain will use the same instance.
   */
  Request = 'Request',

  /**
   * A new instance will be created on each resolution.
   */
  Transient = 'Transient',
}
