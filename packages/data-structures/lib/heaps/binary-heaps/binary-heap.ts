import { compare } from '@guarani/objects';
import { Nullable } from '@guarani/types';

/**
 * Abstract Base Class representation of the Binary Heap.
 */
export abstract class BinaryHeap<T> {
  /**
   * Function used to compare the values of two Items.
   */
  protected abstract readonly comparator: (left: T, right: T) => boolean;

  /**
   * Array storage of the Binary Heap.
   */
  protected readonly heap: T[] = [];

  /**
   * Length of the Binary Heap.
   */
  public get length(): number {
    return this.heap.length;
  }

  /**
   * Creates a Binary Heap from an Array of Binary Heap Arrays.
   *
   * @param heaps Array of Binary Heap Arrays.
   * @returns Binary Heap from the provided Binary Heap Arrays.
   */
  public static from<T>(heaps: T[][]): BinaryHeap<T> {
    const obj = <BinaryHeap<T>>Reflect.construct(this.constructor, []);
    heaps.forEach((heap) => heap.forEach((item) => obj.insert(item)));
    return obj;
  }

  /**
   * Merges multiple Binary Heaps into one.
   *
   * @param heaps Binary Heaps to be merged.
   * @returns Merged Binary Heaps.
   */
  public static merge<T>(heaps: BinaryHeap<T>[]): BinaryHeap<T> {
    return this.from(heaps.map((heap) => heap.heap));
  }

  /**
   * Returns the index of the Item's parent.
   *
   * @param index Index of the Item.
   */
  protected parent(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  /**
   * Returns the index of the Item's left child.
   *
   * @param index Index of the Item.
   */
  protected leftChild(index: number): number {
    return 2 * index + 1;
  }

  /**
   * Returns the index of the Item's right child.
   *
   * @param index Index of the Item.
   */
  protected rightChild(index: number): number {
    return 2 * (index + 1);
  }

  /**
   * Checks if the Binary Heap is empty.
   */
  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Inserts the provided Item into the Binary Heap.
   *
   * @param item Item to be inserted into the Binary Heap.
   */
  public insert(item: T): void {
    const index = this.heap.push(item) - 1;
    this.siftUp(index);
  }

  /**
   * Returns the Top Value of the Binary Heap.
   */
  public get(): Nullable<T> {
    return this.heap[0];
  }

  /**
   * Extracts the Top Value of the Binary Heap.
   */
  public extract(): Nullable<T> {
    if (this.isEmpty()) {
      return null;
    }

    if (this.heap.length === 1) {
      return this.heap.pop()!;
    }

    const item = this.heap[0];

    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();

    this.siftDown(0);

    return item;
  }

  /**
   * Deletes the provided Item from the Binary Heap.
   *
   * @param item Item to be deleted.
   */
  public delete(item: T): void {
    const index = this.heap.indexOf(item);

    this.markForDeletion(index);
    this.extract();
  }

  /**
   * Checks if the provided Binary Heap is equal to the current Binary Heap.
   *
   * @param other Other Binary Heap to be compared.
   * @returns True if both Binary Heaps are equal, otherwise False.
   */
  public equals(other: BinaryHeap<T>): boolean {
    return compare(this.heap, other.heap) === 0;
  }

  /**
   * Fixes the Binary Heap Bottom-Up.
   *
   * @param index Index of the starting Item.
   */
  protected siftUp(index: number): void {
    const checkCondition = (index: number): boolean => {
      return this.heap[index] === null || this.comparator(this.heap[this.parent(index)], this.heap[index]);
    };

    for (let i = index; i !== 0 && checkCondition(i); this.swap(i, this.parent(i)), i = this.parent(i));
  }

  /**
   * Fixes the Binary Heap Top-Down.
   *
   * @param index Index of the starting Item.
   */
  protected siftDown(index: number): void {
    let left: number;
    let right: number;
    let pivot: number = index;

    for (let current = index; current < this.length; this.swap(current, pivot), current = pivot) {
      left = this.leftChild(current);
      right = this.rightChild(current);

      if (this.heap[left] === null) {
        break;
      }

      if (
        this.comparator(this.heap[current], this.heap[left]) &&
        this.comparator(this.heap[current], this.heap[right])
      ) {
        break;
      }

      if (left < this.length && this.comparator(this.heap[left], this.heap[current])) {
        pivot = left;
      }

      if (right < this.length && this.comparator(this.heap[right], this.heap[pivot])) {
        pivot = right;
      }
    }
  }

  /**
   * Swaps the provided Items in the Binary Heap.
   *
   * @param left Index of the Left Item.
   * @param right Index of the Right Item.
   */
  protected swap(left: number, right: number): void {
    const tmp = this.heap[left];
    this.heap[left] = this.heap[right];
    this.heap[right] = tmp;
  }

  /**
   * Marks the Item at the provided index to be deleted.
   *
   * @param index Index of the Item to be deleted.
   */
  protected markForDeletion(index: number): void {
    this.heap[index] = null!;
    this.siftUp(index);
  }
}
