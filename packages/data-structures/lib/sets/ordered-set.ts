import { Nullable, Optional } from '@guarani/types';

import util from 'util';

import { AbstractSet } from './abstract-set';

/**
 * Implementation of a Set that remembers the insertion order of its Items.
 */
export class OrderedSet<T> extends AbstractSet<T> implements Iterable<T> {
  /**
   * Internal native Set used to store the data of the Ordered Set.
   */
  private readonly set: Set<T>;

  /**
   * Number of Items in the Ordered Set.
   */
  public get length(): number {
    return this.set.size;
  }

  /**
   * Instantiates a new Ordered Set.
   *
   * @param items Optional initial Items of the Ordered Set.
   */
  public constructor(items?: Optional<Iterable<T>>) {
    super();

    this.set = new Set<T>(items);
  }

  /**
   * Adds the provided Item into the Ordered Set.
   *
   * @param item Item to be added in the Ordered Set.
   */
  public add(item: T): void {
    this.set.add(item);
  }

  /**
   * Checks if the provided Item is present at the Ordered Set.
   *
   * @param item Item to be checked.
   */
  public has(item: T): boolean {
    return this.set.has(item);
  }

  /**
   * Gets the first Item that satisfies the provided predicate.
   *
   * @param predicate Predicate function used to find the requested Item.
   */
  public find(predicate: (item: T) => boolean): Nullable<T> {
    for (const item of this) {
      if (predicate(item)) {
        return item;
      }
    }

    return null;
  }

  /**
   * Deletes the provided Item from the Ordered Set.
   *
   * @param item Item to be deleted.
   * @returns Result of the deletion.
   */
  public delete(item: T): boolean {
    return this.set.delete(item);
  }

  /**
   * Clears the Ordered Set.
   */
  public clear(): void {
    this.set.clear();
  }

  /**
   * Iterates over the Items of the Ordered Set.
   */
  public *[Symbol.iterator](): IterableIterator<T> {
    for (const item of this.set) {
      yield item;
    }
  }

  /**
   * Representation of the Ordered Set.
   */
  public [util.inspect.custom]() {
    if (this.isEmpty()) {
      return `OrderedSet(0) {}`;
    }

    const data = util.inspect([...this]).replace(/[[\]]/g, '');

    return `OrderedSet(${this.length}) {${data}}`;
  }
}
