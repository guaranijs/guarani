import { Nullable } from '@guarani/utils/types'

import util from 'util'

import { LinkedList } from './linked-list'

/**
 * Implementation of a LIFO Stack.
 */
export class Stack<T> implements Iterable<T> {
  /**
   * Internal array representing the data of the Stack.
   */
  readonly #stack: LinkedList<T>

  /**
   * Instantiates a new empty Stack.
   */
  public constructor()

  /**
   * Instantiates a new Stack based on the provided items.
   *
   * @param items Items to be used by the Stack.
   */
  public constructor(items: Iterable<T>)

  /**
   * Instantiates a new Stack.
   *
   * @param items Items to be used by the Stack.
   */
  public constructor(items?: Iterable<T>) {
    this.#stack = new LinkedList<T>()

    for (const item of items ?? []) {
      this.stack(item)
    }
  }

  /**
   * Length of the Stack.
   */
  public get length(): number {
    return this.#stack.length
  }

  /**
   * Adds the provided item at the top of the Stack.
   *
   * @param item Item to be pushed into the Stack.
   */
  public stack(item: T): Stack<T> {
    this.#stack.addHead(item)

    return this
  }

  /**
   * Removes the item at the top of the Stack and returns it.
   */
  public unstack(): Nullable<T> {
    const item = this.#stack.at(0)

    this.#stack.deleteAt(0)

    return item
  }

  /**
   * Checks the data of the First Element of the Stack without removing it.
   */
  public peek(): Nullable<T> {
    return this.#stack.at(0)
  }

  /**
   * Clears the Stack.
   */
  public clear(): Stack<T> {
    this.#stack.clear()

    return this
  }

  /**
   * Checks if the Stack is empty.
   */
  public isEmpty(): boolean {
    return this.#stack.length === 0
  }

  /**
   * Returns an iterator over the items of the Stack,
   * unstacking them in the process.
   */
  public [Symbol.iterator](): Iterator<T> {
    return {
      next: (): IteratorResult<T, any> => {
        return this.isEmpty()
          ? { done: true, value: undefined }
          : { done: false, value: this.unstack()! }
      }
    }
  }

  /**
   * Describes the format of the Stack.
   */
  public [util.inspect.custom]() {
    return this.#stack.toArray()
  }
}
