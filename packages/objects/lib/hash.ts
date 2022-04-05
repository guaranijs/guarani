import { Hashable } from '@guarani/types';

/**
 * Creates an integer hash code of the provided BigInt object.
 *
 * @param obj BigInt object to be hashed.
 * @returns Integer Number representation of the BigInt object.
 */
export function hash(obj: bigint): number;

/**
 * Hashes the provided Number object into its rounded integer value.
 *
 * @param obj Number to be hashed.
 * @returns Rounded integer value of the provided Number as its own hash code.
 */
export function hash(obj: number): number;

/**
 * Creates a hash code of the provided pure function.
 *
 * @param obj Pure function to be hashed.
 * @returns Hash Code of the provided pure function.
 */
export function hash(obj: Function): number;

/**
 * Creates an integer hash code of the provided string.
 *
 * @param obj String to be hashed.
 * @returns Hash Code of the provided string.
 */
export function hash(obj: string): number;

/**
 * Creates an integer hash code of the provided Buffer object.
 *
 * @param obj Buffer object to be hashed.
 * @returns Hash Code of the provided Buffer object.
 */
export function hash(obj: Buffer): number;

/**
 * Creates an integer hash code of the elements of the provided Array.
 *
 * @param obj Array to be hashed.
 * @returns Hash Code of the provided Array.
 */
export function hash<T>(obj: T[]): number;

/**
 * Creates an integer hash code based on the provided hashable object's data.
 *
 * @param obj Object to be hashed.
 * @returns Hash Code of the provided object.
 */
export function hash<T extends Hashable>(obj: T): number;

/**
 * Creates an integer hash code based on the object's data.
 *
 * @param obj Object to be hashed.
 * @returns Hash Code of the provided object.
 */
export function hash<T extends Hashable>(obj: bigint | number | Function | string | Buffer | Array<any> | T): number {
  if (obj === undefined) {
    throw new Error('Cannot hash "undefined".');
  }

  if (obj === null) {
    throw new Error('Cannot hash "null".');
  }

  if (typeof obj === 'bigint') {
    return Number(BigInt.asUintN(64, obj));
  }

  if (typeof obj === 'number') {
    return Math.abs(Math.round(obj));
  }

  const power = 2 ** 32;

  if (typeof obj === 'function') {
    return String(obj)
      .split('')
      .reduce((result, value) => {
        return (((31 * result) % power) + value.charCodeAt(0)) % power;
      }, 0);
  }

  if (typeof obj === 'string') {
    return obj.split('').reduce((result, value) => {
      return (((31 * result) % power) + value.charCodeAt(0)) % power;
    }, 0);
  }

  if (Buffer.isBuffer(obj)) {
    return obj.reduce((result, value) => {
      return (((31 * result) % power) + value) % power;
    }, 0);
  }

  if (Array.isArray(obj)) {
    return obj.reduce((result, value) => {
      return (((31 * result) % power) + hash(value)) % power;
    }, 0);
  }

  return obj.hashCode();
}
