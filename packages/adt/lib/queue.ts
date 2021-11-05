import { Nullable } from '@guarani/utils/types'

import util from 'util'

import { LinkedList } from './linked-list'

/**
 * Implementation of a FIFO Queue.
 */
export class Queue<T> implements Iterable<T> {
  /**
   * Internal array representing the data of the Queue.
   */
  readonly #queue: LinkedList<T>

  /**
   * Instantiates a new empty Queue.
   */
  public constructor()

  /**
   * Instantiates a new Queue based on the provided items.
   *
   * @param items Items to be used by the Queue.
   */
  public constructor(items: Iterable<T>)

  /**
   * Instantiates a new Queue.
   *
   * @param items Items to be used by the Queue.
   */
  public constructor(items?: Iterable<T>) {
    this.#queue = LinkedList.of(...(items ?? []))
  }

  /**
   * Length of the Queue.
   */
  public get length(): number {
    return this.#queue.length
  }

  /**
   * Enqueues the provided item into the end of the Queue.
   *
   * @param values Item to be enqueued into the Queue.
   */
  public enqueue(item: T): Queue<T> {
    this.#queue.addTail(item)

    return this
  }

  /**
   * Removes the head of the Queue and returns it.
   */
  public dequeue(): Nullable<T> {
    const item = this.#queue.at(0)

    this.#queue.deleteAt(0)

    return item
  }

  /**
   * Checks the data of the head of the Queue without removing it.
   */
  public peek(): Nullable<T> {
    return this.#queue.at(0)
  }

  /**
   * Clears the Queue.
   */
  public clear(): Queue<T> {
    this.#queue.clear()

    return this
  }

  /**
   * Checks if the Queue is empty.
   */
  public isEmpty(): boolean {
    return this.#queue.length === 0
  }

  /**
   * Returns an Iterator over the items of the Queue,
   * dequeueing them in the process.
   */
  public [Symbol.iterator](): Iterator<T> {
    return {
      next: (): IteratorResult<T, any> => {
        return this.isEmpty()
          ? { done: true, value: undefined }
          : { done: false, value: this.dequeue()! }
      }
    }
  }

  /**
   * Describes the format of the Queue.
   */
  public [util.inspect.custom]() {
    return this.#queue.toArray()
  }
}
