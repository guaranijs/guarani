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
   * * **< 0**: If `this` object is **smaller than** `other`.
   * * **> 0**: If `this` object is **greater than** `other`.
   *
   * This method must follow the following restrictions:
   *
   * * If `this.compare(other) < 0`, then `other.compare(this) >= 0`.
   * * If `this.compare(other) > 0`, then `other.compare(this) <= 0`.
   * * If `this.compare(other) === 0`, then `other.compare(this) === 0`.
   * * If `this.compare(other) $ 0` and `other.compare(another) $ 0`, then `this.compare(another) $ 0`,
   *   where **$** is any of the operators **{<, <=, ===, >=, >}**.
   *
   * @param other Object to be compared.
   * @returns Resulting of the comparison.
   */
  compare(other: T): number;
}
