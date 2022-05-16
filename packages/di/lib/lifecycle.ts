/**
 * Scope of the resolution of a Token.
 */
export enum Lifecycle {
  /**
   * All resolutions on all containers will use the same instance.
   */
  Singleton = 'Singleton',

  /**
   * All requests of a single resolution chain will use the same instance.
   */
  Request = 'Request',

  /**
   * A new instance will be created on each resolution.
   *
   * *Note: This is the default Lifecycle when none is provided.*
   */
  Transient = 'Transient',
}
