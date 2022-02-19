import { Nullable, Optional } from '@guarani/types';

import util from 'util';

import { LinkedList } from './lists/linked-list/linked-list';

/**
 * Implementation of a FIFO Queue.
 */
export class Queue<T> implements Iterable<T> {
  /**
   * Internal array representing the data of the Queue.
   */
  private readonly queue: LinkedList<T>;

  /**
   * Length of the Queue.
   */
  public get length(): number {
    return this.queue.length;
  }

  /**
   * Instantiates a new Queue.
   *
   * @param items Optional initial Items of the Queue.
   */
  public constructor(items?: Optional<Iterable<T>>) {
    this.queue = new LinkedList<T>(items);
  }

  /**
   * Checks if the Queue is empty.
   */
  public isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  /**
   * Enqueues the provided item into the end of the Queue.
   *
   * @param data Item to be enqueued into the Queue.
   */
  public enqueue(data: T): void {
    this.queue.insertLast(data);
  }

  /**
   * Removes the head of the Queue and returns it.
   */
  public dequeue(): Nullable<T> {
    if (this.isEmpty()) {
      return null;
    }

    const data = this.queue.head!.item;

    this.queue.deleteFirst();

    return data;
  }

  /**
   * Checks the data of the head of the Queue without removing it.
   */
  public peek(): Nullable<T> {
    return this.isEmpty() ? null : this.queue.head!.item;
  }

  /**
   * Clears the Queue.
   */
  public clear(): void {
    this.queue.clear();
  }

  /**
   * Returns an Iterator over the items of the Queue,
   * dequeueing them in the process.
   */
  public [Symbol.iterator](): Iterator<T> {
    return {
      next: (): IteratorResult<T, any> => {
        return this.isEmpty() ? { done: true, value: null } : { done: false, value: this.dequeue()! };
      },
    };
  }

  /**
   * Representation of the Queue.
   */
  public [util.inspect.custom]() {
    return this.queue.toArray();
  }
}
