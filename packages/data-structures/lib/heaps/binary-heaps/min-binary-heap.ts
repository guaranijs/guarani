import { compare } from '@guarani/objects';

import { BinaryHeap } from './binary-heap';

/**
 * Implementation of a Min-Heap Binary Heap.
 */
export class MinBinaryHeap<T> extends BinaryHeap<T> {
  /**
   * Checks if `left` is smaller than `right`.
   *
   * @param left Left Item.
   * @param right Right Item.
   * @returns Result of the comparison of `left` and `right`.
   */
  protected readonly comparator = (left: T, right: T) => {
    return compare(left, right) < 0;
  };

  /**
   * Decreases the value of the Item at the provided index
   * and reorganizes the Min Binary Heap.
   *
   * @param index Index of the Item to be changed.
   * @param item New value of the Item.
   */
  public decreaseKey(index: number, item: T): void {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`No item found at position ${index}.`);
    }

    if (!this.comparator(item, this.heap[index])) {
      throw new Error('The new value must be smaller than the current value.');
    }

    this.heap[index] = item;
    this.siftUp(index);
  }
}
