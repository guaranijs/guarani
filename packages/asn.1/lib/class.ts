/**
 * Indicates the Class of the provided Tag.
 */
export enum Class {
  /**
   * The meaning of the Type is the same over all applications.
   */
  Universal = 0x00,

  /**
   * The meaning of the Type is specific to the application.
   */
  Application = 0x40,

  /**
   * The meaning of the Type is specific under a structured category.
   *
   * E.g.: A structured type can have the same Tag with two different meanings.
   */
  ContextSpecific = 0x80,

  /**
   * The meaning of the Type is specific to the enterprise.
   */
  Private = 0xc0,
}
