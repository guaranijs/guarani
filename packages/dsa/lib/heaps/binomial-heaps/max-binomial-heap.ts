import { compare } from '@guarani/objects';

import { BinomialHeap } from './binomial-heap';
import { BinomialHeapNode } from './binomial-heap-node';

/**
 * Implementation of a Max-Heap Binomial Heap.
 */
export class MaxBinomialHeap<T> extends BinomialHeap<T> {
  /**
   * Function used to compare the values of two items.
   */
  protected readonly comparator = (left: T, right: T) => {
    return compare(left, right) > 0;
  };

  /**
   * Increases the value of the provided Node and reorganizes the Binomial Heap.
   *
   * @param node Node to be increased.
   * @param newValue New value of the Node.
   */
  public increaseKey(node: BinomialHeapNode<T>, newValue: T): void {
    if (!this.comparator(newValue, node.item)) {
      throw new Error('The new value must be greater than the current.');
    }

    node.item = newValue;
    this.bubbleUp(node);
  }
}
