/**
 * Describes the format of a constructor function or class.
 */
export interface Constructor<T = any> {
  /**
   * Constructor signature.
   */
  new (...args: any[]): T

  /**
   * Prototype of the Constructor.
   */
  prototype: T
}

/**
 * Describes the format of a constructor function or class.
 */
export interface AbstractConstructor<T = any> {
  /**
   * Prototype of the Abstract Constructor.
   */
  prototype: T
}

/**
 * Describes the format of a factory function.
 */
export type Factory<T> = () => T

/**
 * Describes the format of a dictionary.
 */
export type Dict<T = any> = { [key: string]: T }

/**
 * Describes the format of either an element or a list of it.
 */
export type OneOrMany<T> = T | T[]

/**
 * Describes a nullable type.
 */
export type Nullable<T> = T | null | undefined
