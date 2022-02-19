import { compare } from '@guarani/objects';
import { Nullable } from '@guarani/types';

import util from 'util';

/**
 * Abstract Base Class of the Abstract Set.
 */
export abstract class AbstractSet<T> implements Iterable<T> {
  /**
   * Number of Items in the Set.
   */
  public abstract length: number;

  /**
   * Checks if the Set is empty.
   */
  public isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * Adds the provided Item into the Set.
   *
   * @param item Item to be added in the Set.
   */
  public abstract add(item: T): void;

  /**
   * Checks if the provided Item is present at the Set.
   *
   * @param item Item to be checked.
   */
  public abstract has(item: T): boolean;

  /**
   * Returns the first Item that satisfies the provided predicate.
   *
   * @param predicate Predicate function used to find the requested Item.
   */
  public abstract find(predicate: (item: T) => unknown): Nullable<T>;

  /**
   * Deletes the provided Item from the Set.
   *
   * @param item Item to be deleted.
   * @returns Result of the deletion.
   */
  public abstract delete(item: T): boolean;

  /**
   * Clears the Set.
   */
  public abstract clear(): void;

  /**
   * Checks if the Sets are Disjoint; that is, if their intersection
   * is the NULL Set.
   *
   * @param other Set to be compared.
   */
  public isDisjoint(other: AbstractSet<T>): boolean {
    return this.intersection(other).length === 0;
  }

  /**
   * Checks if the Set is a Superset of the provided Set.
   *
   * @param other Set to be checked.
   */
  public isSuperset(other: AbstractSet<T>): boolean {
    if (this === other) {
      return true;
    }

    if (this.length < other.length) {
      return false;
    }

    for (const item of other) {
      if (!this.has(item)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if the Set is a Subset of the provided Set.
   *
   * @param other Set to be checked.
   */
  public isSubset(other: AbstractSet<T>): boolean {
    if (this === other) {
      return true;
    }

    if (this.length > other.length) {
      return false;
    }

    for (const item of this) {
      if (!other.has(item)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if the provided Set is equal to the current Set.
   *
   * To be considered equal, both Sets **MUST** have **EXACTLY**
   * the same elements.
   *
   * @param other Other Set to be compared.
   * @returns True if both sets are equal, otherwise False.
   */
  public equals(other: AbstractSet<T>): boolean {
    if (this.length !== other.length) {
      return false;
    }

    for (const item of this) {
      if (!other.has(item)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Creates a Set based on the Union of the current
   * Ordered Set and the provided Sets.
   *
   * @param others Other Sets to be included in the Union.
   */
  public union(...others: AbstractSet<T>[]): AbstractSet<T> {
    const result = <AbstractSet<T>>Reflect.construct(this.constructor, [this]);

    for (const set of others) {
      for (const item of set) {
        result.add(item);
      }
    }

    return result;
  }

  /**
   * Creates a Set based on the Intersection of the current
   * Ordered Set the provided Sets.
   *
   * @param others Other Sets to be included in the Intersection.
   */
  public intersection(...others: AbstractSet<T>[]): AbstractSet<T> {
    const result = <AbstractSet<T>>Reflect.construct(this.constructor, []);
    const sets = [this, ...others].sort((a, b) => compare(a.length, b.length));
    const pivot = sets.shift()!;

    for (const item of pivot) {
      let intersects = true;

      for (const set of sets) {
        if (!set.has(item)) {
          intersects = false;
        }
      }

      if (intersects) {
        result.add(item);
      }
    }

    return result;
  }

  /**
   * Creates a Set of the items that are present in the current
   * Set but not in the provider other Set.
   *
   * @param other Set to be checked.
   */
  public difference(other: AbstractSet<T>): AbstractSet<T> {
    const result = <AbstractSet<T>>Reflect.construct(this.constructor, []);

    for (const item of this) {
      if (!other.has(item)) {
        result.add(item);
      }
    }

    return result;
  }

  /**
   * Returns an Array of the Items of the Set.
   */
  public toArray(): T[] {
    return [...this];
  }

  /**
   * Iterates over the Items of the Set and executes
   * the provided predicate function on them.
   *
   * @param predicate Predicate function to be executed on each Item.
   */
  public forEach(predicate: (item: T) => void): void {
    for (const item of this) {
      predicate(item);
    }
  }

  /**
   * Filters the Set based on the Items that satisfy the provided predicate.
   *
   * @param predicate Predicate function used to filter the Set.
   * @returns Set with the filtered Items.
   */
  public filter(predicate: (item: T) => boolean): AbstractSet<T> {
    const set = <AbstractSet<T>>Reflect.construct(this.constructor, []);

    for (const item of this) {
      if (predicate(item)) {
        set.add(item);
      }
    }

    return set;
  }

  /**
   * Maps a callback function on each Item of the Set and returns a new Set
   * based on the results.
   *
   * @param callback Callback function used to map each Item of the Set.
   * @returns New Set based on the mapped Items.
   */
  public map<U>(callback: (item: T) => U): AbstractSet<U> {
    const set = <AbstractSet<U>>Reflect.construct(this.constructor, []);

    for (const item of this) {
      set.add(callback(item));
    }

    return set;
  }

  /**
   * Checks if every Item of the Set satisfy the provided predicate.
   *
   * @param predicate Predicate function used to check every Item.
   */
  public every(predicate: (item: T) => boolean): boolean {
    for (const item of this) {
      if (!predicate(item)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if at least one Item of the Set satisfies the provided predicate.
   *
   * @param predicate Predicate function used to check every Item.
   */
  public some(predicate: (item: T) => boolean): boolean {
    for (const item of this) {
      if (predicate(item)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns an iterator over the Items of the Set.
   */
  public *keys(): IterableIterator<T> {
    return this.values();
  }

  /**
   * Returns an iterator over the Items of the Set.
   */
  public *values(): IterableIterator<T> {
    return this[Symbol.iterator]();
  }

  /**
   * Returns an iterator of the format [item, item]
   * over the Items of the Set.
   */
  public *entries(): IterableIterator<[T, T]> {
    for (const item of this.values()) {
      yield [item, item];
    }
  }

  /**
   * Iterates over the Items of the Set.
   */
  public abstract [Symbol.iterator](): IterableIterator<T>;

  /**
   * Representation of the Set.
   */
  public abstract [util.inspect.custom](): any;
}
