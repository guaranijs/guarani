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
   * @param other Object to be compared.
   */
  compare(other: T): number
}
