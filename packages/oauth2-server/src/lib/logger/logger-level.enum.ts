/**
 * Levels of Logging supported by Guarani.
 */
export enum LoggerLevel {
  /**
   * Indicates an error that prevents the system from functioning correctly.
   */
  CRITICAL,

  /**
   * Indicates an error caused by the business rules of the system,
   * but does not prevent the system from functioning correctly.
   */
  ERROR,

  /**
   * Indicates that something happened on the system that should be further
   * investigated, but does not affect the functionality of the system.
   */
  WARNING,

  /**
   * Indicates an action performed by the system.
   */
  INFORMATION,

  /**
   * Displays information for debugging purposes.
   */
  DEBUG,

  /**
   * Granular information about the process executed by the system.
   */
  TRACE,
}
