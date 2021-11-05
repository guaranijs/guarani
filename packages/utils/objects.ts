import { deprecate } from 'util'

import { Comparable } from './interfaces'
import { Constructor, Dict } from './types'

/**
 * Options to enhance the comparison of equals().
 */
interface EqualsOptions {
  /**
   * Defines whether all arrays must be sorted before comparison.
   */
  readonly sortArrays?: boolean
}

export class Objects {
  /**
   * Removes nullish values from the properties
   * of an object or an array of objects.
   *
   * @param data Object or array of objects to be cleansed.
   * @returns Object or array of objects without nullish values.
   */
  public static removeNullishValues<T>(data: T): T {
    if (data == null || typeof data !== 'object') {
      return data
    }

    return Object.entries(data).reduce((result, [key, value]) => {
      if (value == null) {
        return result
      }

      if (Array.isArray(value)) {
        const mappedArray = value
          .filter(e => !(e == null))
          .map(e => this.removeNullishValues<T>(e))

        Object.defineProperty(result, key, {
          configurable: true,
          enumerable: true,
          value: mappedArray,
          writable: true
        })
      } else if (typeof value === 'object') {
        Object.defineProperty(result, key, {
          configurable: true,
          enumerable: true,
          value: this.removeNullishValues<T>(value),
          writable: true
        })
      } else {
        Object.defineProperty(result, key, {
          configurable: true,
          enumerable: true,
          value,
          writable: true
        })
      }

      return result
    }, <T>{})
  }

  /**
   * Perfoms a deep comparison between the properties of two objects.
   *
   * @param first First object.
   * @param last Last object.
   * @param options Defines the options to enhance the comparison.
   * @returns Boolean informing whether or not the two objects are equal.
   * @deprecated Use `util.isDeepStrictEqual()` instead.
   */
  public static deepEquals(
    first: unknown,
    last: unknown,
    options: EqualsOptions = {}
  ): boolean {
    if (first === undefined && last === undefined) {
      return true
    }

    if (first === null && last === null) {
      return true
    }

    if (
      (typeof first === 'bigint' && typeof last === 'bigint') ||
      (typeof first === 'boolean' && typeof last === 'boolean') ||
      (typeof first === 'number' && typeof last === 'number') ||
      (typeof first === 'string' && typeof last === 'string')
    ) {
      return first === last
    }

    if (Buffer.isBuffer(first) && Buffer.isBuffer(last)) {
      return Buffer.compare(first, last) === 0
    }

    if (Array.isArray(first) && Array.isArray(last)) {
      if (first.length !== last.length) {
        return false
      }

      if (options.sortArrays === true) {
        first.sort()
        last.sort()
      }

      for (let i = 0; i < first.length; i++) {
        if (!this.deepEquals(first[i], last[i], options)) {
          return false
        }
      }

      return true
    }

    if (typeof first === 'object' && typeof last === 'object') {
      const firstKeys = Object.keys(first!).sort()
      const lastKeys = Object.keys(last!)

      if (firstKeys.length !== lastKeys.length) {
        return false
      }

      for (const key of firstKeys) {
        if (!this.deepEquals((<Dict>first)[key], (<Dict>last)[key], options)) {
          return false
        }
      }

      return true
    }

    return false
  }

  /**
   * Recursively freezes the properties or items of the provided object.
   *
   * @param obj Object to be frozen.
   * @returns Frozen object.
   */
  public static deepFreeze<T>(obj: T): Readonly<T> {
    Object.freeze(obj)

    Object.values(obj).forEach(value => {
      if (
        (typeof value === 'object' || typeof value === 'function') &&
        !Object.isFrozen(value)
      ) {
        if (Array.isArray(value)) {
          value.forEach(elm => this.deepFreeze(elm))
        }

        this.deepFreeze(value)
      }
    })

    return obj
  }

  /**
   * Merges the provided mixin classes into a single one and returns it.
   *
   * @param mixins List of mixins to be merged into a single class.
   * @returns Constructor of the resulting class.
   */
  public static applyMixins(mixins: Constructor[]): any {
    if (!Array.isArray(mixins) || mixins.length === 0) {
      throw new Error('Invalid parameter "mixins".')
    }

    if (mixins.length === 1) {
      return mixins[0]
    }

    const BaseMixin = mixins.shift()!

    mixins.forEach(Mixin => {
      Object.getOwnPropertyNames(Mixin.prototype).forEach(name => {
        Object.defineProperty(
          BaseMixin.prototype,
          name,
          Object.getOwnPropertyDescriptor(Mixin.prototype, name) ||
            Object.create(null)
        )
      })
    })

    return BaseMixin
  }

  /**
   * Compares two objects and returns one of the following values:
   *
   * * **0**: If both objects are **equal**.
   * * **-1**: If `obj1` is **smaller than** `obj2`.
   * * **1**: If `obj1` is **greater than** `obj2`.
   *
   * @param obj1 Object to be compared.
   * @param obj2 Object to be compared.
   * @returns Result of the comparison.
   */
  public static compare(obj1: unknown, obj2: unknown): number {
    if (obj1 === undefined && obj2 === undefined) {
      return 0
    }

    if (obj1 === null && obj2 === null) {
      return 0
    }

    if (
      (typeof obj1 === 'bigint' && typeof obj2 === 'bigint') ||
      (typeof obj1 === 'number' && typeof obj2 === 'number') ||
      (typeof obj1 === 'string' && typeof obj2 === 'string')
    ) {
      return obj1 === obj2 ? 0 : obj1 < obj2 ? -1 : 1
    }

    if (Buffer.isBuffer(obj1) && Buffer.isBuffer(obj2)) {
      return Buffer.compare(obj1, obj2)
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1 <= obj2 && obj1 >= obj2) {
        return 0
      }

      if (obj1 < obj2) {
        return -1
      }

      if (obj1 > obj2) {
        return 1
      }
    }

    return (<Comparable<unknown>>obj1).compare(<unknown>obj2)
  }
}

deprecate(Objects.deepEquals, 'Use util.isDeepStrictEqual() instead.')
