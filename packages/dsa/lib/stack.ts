import { Nullable, Optional } from '@guarani/types';

import util from 'util';

import { LinkedList } from './lists/linked-list/linked-list';

/**
 * Implementation of a LIFO Stack.
 */
export class Stack<T> implements Iterable<T> {
  /**
   * Internal array representing the data of the Stack.
   */
  private readonly stack: LinkedList<T>;

  /**
   * Length of the Stack.
   */
  public get length(): number {
    return this.stack.length;
  }

  /**
   * Instantiates a new Stack.
   *
   * @param items Optional initial Items of the Stack.
   */
  public constructor(items?: Optional<Iterable<T>>) {
    this.stack = new LinkedList<T>(items);
  }

  /**
   * Checks if the Stack is empty.
   */
  public isEmpty(): boolean {
    return this.stack.isEmpty();
  }

  /**
   * Adds the provided item at the top of the Stack.
   *
   * @param data Item to be pushed into the Stack.
   */
  public push(data: T): void {
    this.stack.insertFirst(data);
  }

  /**
   * Removes the item at the top of the Stack and returns it.
   */
  public pop(): Nullable<T> {
    if (this.isEmpty()) {
      return null;
    }

    const data = this.stack.head!.item;

    this.stack.deleteFirst();

    return data;
  }

  /**
   * Checks the data of the First Element of the Stack without removing it.
   */
  public peek(): Nullable<T> {
    return this.isEmpty() ? null : this.stack.head!.item;
  }

  /**
   * Clears the Stack.
   */
  public clear(): void {
    this.stack.clear();
  }

  /**
   * Returns an iterator over the items of the Stack,
   * unstacking them in the process.
   */
  public [Symbol.iterator](): Iterator<T> {
    return {
      next: (): IteratorResult<T, any> => {
        return this.isEmpty() ? { done: true, value: null } : { done: false, value: this.pop()! };
      },
    };
  }

  /**
   * Representation of the Stack.
   */
  public [util.inspect.custom]() {
    return this.stack.toArray();
  }
}
