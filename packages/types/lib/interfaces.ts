/**
 * Allows an object to be comparable.
 */
export interface Comparable<T> {
  /**
   * Compares the current object with the object provided as the argument.
   *
   * This method returns one of the three following values:
   *
   * * **0**: If both objects are **equal**.
   * * **-1**: If `this` object is **smaller than** `other`.
   * * **1**: If `this` object is **greater than** `other`.
   *
   * This method must follow the following restrictions:
   *
   * * If `compare(a, b) < 0`, then `compare(b, a) >= 0`.
   * * If `compare(a, b) > 0`, then `compare(b, a) <= 0`.
   * * If `compare(a, b) === 0`, then `compare(b, a) === 0`.
   * * If `compare(a, b) $ 0` and `compare(b, c) $ 0`, then `compare(a, c) $ 0`,
   *   where **$** is any of the operators **{<, <=, ===, >=, >}**.
   *
   * @param other Object to be compared.
   */
  compare(other: T): number;
}

/**
 * Allows an object to be hashable.
 */
export interface Hashable {
  /**
   * Creates an integer hash code based on the object's data.
   */
  hashCode(): number;
}
