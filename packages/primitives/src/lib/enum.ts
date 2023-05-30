import { Dictionary, Nullable } from '@guarani/types';

/**
 * Returns the keys of the Enum.
 *
 * @param enumObj Enum object to be inspected.
 * @returns Collection of the keys of the Enum.
 */
export function getKeys<T extends Dictionary<unknown>>(enumObj: T): (keyof T)[] {
  return Object.keys(enumObj).filter((key) => Number.isNaN(Number(key)));
}

/**
 * Returns the key of the first Enum member that represents the provided value.
 *
 * @param enumObj Enum object to be inspected.
 * @param value Value to be searched.
 * @returns Key of the first Enum member based on the provided value.
 */
export function getKey<T extends Dictionary<unknown>>(enumObj: T, value: unknown): Nullable<keyof T> {
  return getKeys(enumObj).find((key) => enumObj[key] === value) ?? null;
}

/**
 * Checks if the provided Enum has the provided key as its member.
 *
 * @param enumObj Enum object to be inspected.
 * @param key Key to be checked.
 * @returns Whether the provided Enum has the provided key as its member.
 */
export function hasKey<T extends Dictionary<unknown>>(enumObj: T, key: unknown): key is keyof T {
  return typeof key === 'string' && getKeys(enumObj).includes(key);
}

/**
 * Returns the values of the Enum.
 *
 * @param enumObj Enum object to be inspected.
 * @returns Collection of the Values of the Enum.
 */
export function getValues<T extends Dictionary<unknown>>(enumObj: T): T[keyof T][] {
  return getKeys(enumObj).map((key) => enumObj[key]);
}

/**
 * Converts the provided value into a member of the provided Enum.
 *
 * @param enumObj Enum object to be inspected.
 * @param value Value to be searched.
 * @returns Enum member based on the provided value.
 */
export function parse<T extends Dictionary<unknown>>(enumObj: T, value: unknown): Nullable<T[keyof T]> {
  return getValues(enumObj).find((attr) => attr === value) ?? null;
}

/**
 * Checks if the provided Enum has the provided value as its member.
 *
 * @param enumObj Enum object to be inspected.
 * @param value Value to be checked.
 * @returns Whether the provided Enum has the provided value as its member.
 */
export function hasValue<T extends Dictionary<unknown>>(enumObj: T, value: unknown): value is T[keyof T] {
  return getKey(enumObj, value) !== null;
}

/**
 * Returns the entries of the provided Enum.
 *
 * @param enumObj Enum object to be inspected.
 * @returns Entries of the provided Enum.
 */
export function getEntries<T extends Dictionary<unknown>>(enumObj: T): [keyof T, T[keyof T]][] {
  return getKeys(enumObj).map((key) => [key, enumObj[key]]);
}
