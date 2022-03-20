import { compare } from '@guarani/objects';
import { Nullable } from '@guarani/types';

import util from 'util';

import { BinomialHeapNode } from './binomial-heap-node';

util.inspect.defaultOptions = {
  depth: 256,
};

/**
 * Abstract Base Class of the Binomial Heap.
 */
export abstract class BinomialHeap<T> {
  /**
   * Function used to compare the values of two items.
   */
  protected abstract readonly comparator: (left: T, right: T) => boolean;

  /**
   * Head of the Binomial Forest.
   */
  protected head: Nullable<BinomialHeapNode<T>> = null;

  /**
   * Length of the Binomial Heap.
   */
  protected _length: number = 0;

  /**
   * Length of the Binomial Heap.
   */
  public get length(): number {
    return this._length;
  }

  /**
   * Checks if the Binomial Heap is empty.
   */
  public isEmpty(): boolean {
    return this.head === null;
  }

  /**
   * Inserts the provided Item into the Binomial Heap.
   *
   * @param item Item to be inserted into the Binomial Heap.
   * @returns Reference to the newly inserted Binomial Heap Node.
   */
  public insert(item: T): BinomialHeapNode<T> {
    const node = new BinomialHeapNode<T>(item);
    const heap = <BinomialHeap<T>>Reflect.construct(this.constructor, []);

    heap.head = node;
    heap._length = 1;

    this.union(heap);

    return node;
  }

  /**
   * Combines two Binomial Heaps into one.
   *
   * @param other Binomial Heap to be combined.
   */
  public union(other: BinomialHeap<T>): void {
    this.merge(other);

    if (this.head === null) {
      return;
    }

    this.fixHeapOrder();

    this._length += other._length;
  }

  /**
   * Returns the Top Value of the Binomial Heap.
   */
  public get(): Nullable<T> {
    if (this.head === null) {
      return null;
    }

    let result = this.head;

    for (let node = this.head; node !== null; node = node.sibling!) {
      if (this.comparator(node.item, result.item)) {
        result = node;
      }
    }

    return result.item;
  }

  /**
   * Extracts the Top Value of the Binomial Heap.
   */
  public extract(): Nullable<T> {
    if (this.head === null) {
      return null;
    }

    let result = this.head;
    let resultPrev = null;
    let sibling = result.sibling;
    let siblingPrev = result;

    while (sibling !== null) {
      if (this.comparator(sibling.item, result.item)) {
        result = sibling;
        resultPrev = siblingPrev;
      }

      siblingPrev = sibling;
      sibling = sibling.sibling;
    }

    this.removeTreeRoot(result, resultPrev);

    this._length -= 1;

    return result.item;
  }

  /**
   * Deletes the provided Node from the Binomial Heap.
   *
   * @param node Node to be deleted.
   */
  public delete(node: BinomialHeapNode<T>): void {
    if (this.head === null) {
      return;
    }

    node.item = null!;

    this.bubbleUp(node);

    if (this.head === node) {
      this.removeTreeRoot(node, null);
    } else {
      let previous = this.head!;
      while (previous.sibling !== node) {
        previous = previous.sibling!;
      }

      this.removeTreeRoot(node, previous);
    }

    this._length -= 1;
  }

  /**
   * Checks if the provided Binomial Heap is equal to the current Binomial Heap.
   *
   * @param other Other Binomial Heap to be compared.
   * @returns True if both Binomial Heaps are equal, otherwise False.
   */
  public equals(other: BinomialHeap<T>): boolean {
    if (this._length !== other._length) {
      return false;
    }

    for (
      let thisRoot = this.head, otherRoot = other.head;
      thisRoot !== null && otherRoot !== null;
      thisRoot = thisRoot.sibling, otherRoot = otherRoot.sibling
    ) {
      for (
        let thisLevel = thisRoot, otherLevel = otherRoot;
        thisLevel !== null && otherLevel !== null;
        thisLevel = thisLevel.child!, otherLevel = otherLevel.child!
      ) {
        for (
          let thisNode = thisLevel, otherNode = otherLevel;
          thisNode !== null && otherNode !== null;
          thisNode = thisNode.sibling!, otherNode = otherNode.sibling!
        ) {
          if (compare(thisNode.item, otherNode.item) !== 0) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Fixes the Binomial Tree Bottom-Up.
   *
   * @param node Node to be fixed.
   */
  // TODO: Find a way to simplify this.
  protected bubbleUp(node: BinomialHeapNode<T>): void {
    while (node.parent !== null && (node.item === null || this.comparator(node.item, node.parent.item))) {
      const parent = node.parent;

      let parentPrevious: Nullable<BinomialHeapNode<T>> = null;

      for (let tmp = parent.parent?.child ?? null; tmp !== null; tmp = tmp.sibling) {
        if (tmp.sibling === parent) {
          parentPrevious = tmp;
          break;
        }
      }

      let nodePrevious: Nullable<BinomialHeapNode<T>> = null;

      for (let tmp = parent.child; tmp !== null; tmp = tmp.sibling) {
        if (tmp.sibling === node) {
          nodePrevious = tmp;
          break;
        }
      }

      this.setParent(node, parent.parent);

      if (parent.isChild()) {
        this.setChild(parent.parent!, node);
      }

      const child = node.child;

      if (parent.child === node) {
        this.setChild(node, parent);
      } else {
        this.setChild(node, parent.child);
      }

      this.setChild(parent, child);

      if (parent.child !== null) {
        this.setParent(parent.child, parent);
      }

      this.setParent(parent, node);

      const sibling = node.sibling;

      this.setSibling(node, parent.sibling);
      this.setSibling(parent, sibling);

      for (let tmp = parent.sibling; tmp !== null; tmp = tmp.sibling) {
        this.setParent(tmp, node);
      }

      if (parentPrevious !== null) {
        this.setSibling(parentPrevious, node);
      }

      if (nodePrevious !== null) {
        this.setSibling(nodePrevious, parent);
      }

      for (let tmp = node.child; tmp !== null; tmp = tmp.sibling) {
        this.setParent(tmp, node);
      }

      for (let tmp = parent.child; tmp !== null; tmp = tmp.sibling) {
        this.setParent(tmp, parent);
      }
    }

    while (this.head?.parent != null) {
      this.head = this.head.parent;
    }

    if (this.head === null || this.head === node) {
      return;
    }

    let tmp = this.head;
    for (; tmp.sibling !== node.child; tmp = tmp.sibling!);

    while (node.parent !== null) {
      node = node.parent;
    }

    this.setSibling(tmp, node);
  }

  /**
   * Merges a Binomial Heap into the current Binomial Heap.
   *
   * This operation breaks the property of the Binomial Heap that states
   * that the must be at most one Binomial Tree of a given order K.
   *
   * @param other Binomial Heap to be merged into the current.
   */
  private merge(other: BinomialHeap<T>): void {
    if (this.head === null) {
      this.head = other.head;
      return;
    }

    if (other.head === null) {
      return;
    }

    if (this.head.order > other.head.order) {
      this.swap(other);
    }

    let current = this.head;
    let firstIt = this.head.sibling;
    let secondIt = other.head;

    while (firstIt !== null && secondIt !== null) {
      if (firstIt.order <= secondIt.order) {
        this.setSibling(current, firstIt);
        firstIt = firstIt.sibling;
      } else {
        this.setSibling(current, secondIt);
        secondIt = secondIt.sibling!;
      }

      current = current.sibling!;
    }

    this.setSibling(current, firstIt ?? secondIt);
  }

  /**
   * Swaps the Head of the current Binomial Heap
   * with the Head of the provided Binomial Heap.
   *
   * @param other Binomial Heap to be swapped.
   */
  private swap(other: BinomialHeap<T>): void {
    const head = this.head;

    this.head = other.head;
    other.head = head;

    const length = this._length;

    this._length = other._length;
    other._length = length;
  }

  /**
   * Fixes the Binomial Heap property that requires the heap
   * to have at most one tree of order K.
   */
  private fixHeapOrder(): void {
    if (this.head === null) {
      return;
    }

    let previous: Nullable<BinomialHeapNode<T>> = null;

    for (let current = this.head, sibling = current.sibling; sibling !== null; sibling = current.sibling) {
      if (current.order !== sibling.order || (sibling.sibling !== null && current.order === sibling.sibling.order)) {
        previous = current;
        current = sibling;
      } else {
        if (this.comparator(current.item, sibling.item)) {
          this.setSibling(current, sibling.sibling);
          current.linkTree(sibling);
        } else {
          if (previous === null) {
            this.head = sibling;
          } else {
            this.setSibling(previous, sibling);
          }

          sibling.linkTree(current);
          current = sibling;
        }
      }
    }
  }

  /**
   * Removes the Root Node of the Binomial Tree and re-inserts
   * its children into the Binomial Heap.
   *
   * @param node Root Node of the Binomial Tree.
   */
  private removeTreeRoot(node: BinomialHeapNode<T>, previous: Nullable<BinomialHeapNode<T>>): void {
    if (node === this.head) {
      this.head = node.sibling;
    } else {
      this.setSibling(previous!, node.sibling);
    }

    let newHead: Nullable<BinomialHeapNode<T>> = null;

    for (let child = node.child; child !== null; ) {
      const sibling = child.sibling;

      this.setSibling(child, newHead);
      this.setParent(child, null);

      newHead = child;
      child = sibling;
    }

    const heap = <BinomialHeap<T>>Reflect.construct(this.constructor, []);

    heap.head = newHead;
    heap._length = 1;

    this.union(heap);
  }

  /**
   * Sets the Parent attribute of a Binomial Heap Node.
   *
   * @param node Node to be updated.
   * @param parent Node to be set as the Parent.
   */
  private setParent(node: BinomialHeapNode<T>, parent: Nullable<BinomialHeapNode<T>>): void {
    Reflect.set(node, '_parent', parent);
  }

  /**
   * Sets the Sibling attribute of a Binomial Heap Node.
   *
   * @param node Node to be updated.
   * @param sibling Node to be set as the Sibling.
   */
  private setSibling(node: BinomialHeapNode<T>, sibling: Nullable<BinomialHeapNode<T>>): void {
    Reflect.set(node, '_sibling', sibling);
  }

  /**
   * Sets the Child attribute of a Binomial Heap Node.
   *
   * @param node Node to be updated.
   * @param child Node to be set as the Child.
   */
  private setChild(node: BinomialHeapNode<T>, child: Nullable<BinomialHeapNode<T>>): void {
    Reflect.set(node, '_child', child);
  }

  /**
   * Representation of the Binomial Heap.
   */
  public [util.inspect.custom]() {
    const func = (node: Nullable<BinomialHeapNode<T>>): any => {
      if (node === null) {
        return null;
      }

      return {
        item: node.item,
        parent: node.parent?.item ?? null,
        child: func(node.child),
        sibling: func(node.sibling),
      };
    };

    return func(this.head);
  }
}
