import { Nullable, Optional } from '@guarani/types';

import util from 'util';

import { RedBlackTree } from '../trees/red-black-tree/red-black-tree';
import { AbstractSet } from './abstract-set';

/**
 * Implementation of a Set that always keeps its items sorted.
 */
export class SortedSet<T> extends AbstractSet<T> implements Iterable<T> {
  /**
   * Internal Red-Black Tree used to store the data of the Sorted Set.
   */
  private readonly set: RedBlackTree<T>;

  /**
   * Number of Items in the Sorted Set.
   */
  public get length(): number {
    return this.set.length;
  }

  /**
   * Instantiates a new Sorted Set.
   *
   * @param items Optional initial Items of the Sorted Set.
   */
  public constructor(items?: Optional<Iterable<T>>) {
    super();

    this.set = new RedBlackTree<T>(items);
  }

  /**
   * Adds the provided Item into the Sorted Set.
   *
   * @param item Item to be added in the Sorted Set.
   */
  public add(item: T): void {
    this.set.insert(item);
  }

  /**
   * Checks if the provided Item is present at the Sorted Set.
   *
   * @param item Item to be checked.
   */
  public has(item: T): boolean {
    return this.set.contains(item);
  }

  /**
   * Gets the first Item that satisfies the provided predicate.
   *
   * @param predicate Predicate function used to find the requested Item.
   */
  public find(predicate: (item: T) => number): Nullable<T> {
    return this.set.find(predicate);
  }

  /**
   * Deletes the provided Item from the Sorted Set.
   *
   * @param item Item to be deleted.
   * @returns Result of the deletion.
   */
  public delete(item: T): boolean {
    return this.set.delete(item);
  }

  /**
   * Clears the Sorted Set.
   */
  public clear(): void {
    this.set.clear();
  }

  /**
   * Iterates over the Items of the Sorted Set.
   */
  public *[Symbol.iterator](): IterableIterator<T> {
    const items: T[] = [];

    this.set.inOrder((data) => items.push(data));

    for (const item of items) {
      yield item;
    }
  }

  /**
   * Representation of the Sorted Set.
   */
  public [util.inspect.custom](): string {
    if (this.isEmpty()) {
      return `SortedSet(0) {}`;
    }

    const data = util.inspect([...this]).replace(/[[\]]/g, '');

    return `SortedSet(${this.length}) { ${data} }`;
  }
}
