import { Dict, Optional } from '@guarani/types';

/**
 * Utilities for handling Typescript Enums.
 */
export namespace Enum {
  /**
   * Returns the keys of the Enum.
   *
   * @param enumObj Enum object to be inspected.
   * @returns Collection of the keys of the Enum.
   */
  export function keys<T extends Dict>(enumObj: T): string[] {
    return Object.keys(enumObj).filter((key) => Number.isNaN(Number(key)));
  }

  /**
   * Returns the key of the first Enum member that represents the provided value.
   *
   * @param enumObj Enum object to be inspected.
   * @param value Value to be searched.
   * @returns Key of the first Enum member based on the provided value.
   */
  export function key<T extends Dict>(enumObj: T, value: string | number): Optional<string> {
    return Enum.keys(enumObj).find((key) => enumObj[key] === value);
  }

  /**
   * Checks if the provided Enum has the provided key as its member.
   *
   * @param enumObj Enum object to be inspected.
   * @param key Key to be checked.
   * @returns Whether the provided Enum has the provided key as its member.
   */
  export function hasKey<T extends Dict>(enumObj: T, key: string): boolean {
    return Enum.keys(enumObj).find((memberKey) => memberKey === key) !== undefined;
  }

  /**
   * Returns the values of the Enum.
   *
   * @param enumObj Enum object to be inspected.
   * @returns Collection of the Values of the Enum.
   */
  export function values<T extends Dict>(enumObj: T): any[] {
    return Enum.keys(enumObj).map((key) => enumObj[key]);
  }

  /**
   * Converts the provided value into a member of the provided Enum.
   *
   * @param enumObj Enum object to be inspected.
   * @param value Value to be searched.
   * @returns Enum member based on the provided value.
   */
  export function parse<T extends Dict>(enumObj: T, value: string | number): Optional<T[keyof T]> {
    return Enum.values(enumObj).find((attr) => attr === value);
  }

  /**
   * Checks if the provided Enum has the provided value as its member.
   *
   * @param enumObj Enum object to be inspected.
   * @param value Value to be checked.
   * @returns Whether the provided Enum has the provided value as its member.
   */
  export function hasValue<T extends Dict>(enumObj: T, value: string | number): boolean {
    return Enum.parse(enumObj, value) !== undefined;
  }

  /**
   * Returns the entries of the provided Enum.
   *
   * @param enumObj Enum object to be inspected.
   * @returns Entries of the provided Enum.
   */
  export function entries<T extends Dict>(enumObj: T): [string, T[keyof T]][] {
    return Enum.keys(enumObj).map((key) => [key, enumObj[key]]);
  }
}
