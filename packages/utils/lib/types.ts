/**
 * Describes the format of a constructor function or class.
 */
export type Constructor<T = any> = Function | { new (...args: any[]): T }

/**
 * Describes the format of a factory function.
 */
export type Factory<T> = () => T

/**
 * Describes the format of a dictionary.
 */
export type Dict<T> = { [key: string]: T }

/**
 * Describes the format of either an element or a list of it.
 */
export type OneOrMany<T> = T | T[]
