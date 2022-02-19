import { compare } from '@guarani/objects';
import { Nullable } from '@guarani/types';

/**
 * Implementation of a Node of the Binary Search Tree.
 */
export class BinarySearchTreeNode<T> {
  /**
   * Item represented by the Node.
   */
  public readonly item: T;

  /**
   * Parent Node.
   */
  public parent: Nullable<BinarySearchTreeNode<T>> = null;

  /**
   * Left Child Node.
   */
  public leftChild: Nullable<BinarySearchTreeNode<T>> = null;

  /**
   * Right Child Node.
   */
  public rightChild: Nullable<BinarySearchTreeNode<T>> = null;

  /**
   * Instantiates a new Binary Search Tree Node.
   *
   * @param item Item represented by the Node.
   */
  public constructor(item: T) {
    this.item = item;
  }

  /**
   * Height of the Node.
   */
  public get height(): number {
    const leftChildHeight = this.leftChild?.height ?? 0;
    const rightChildHeight = this.rightChild?.height ?? 0;

    return 1 + Math.max(leftChildHeight, rightChildHeight);
  }

  /**
   * Checks if the Node is a Leaf Node.
   */
  public isLeaf(): boolean {
    return this.leftChild === null && this.rightChild === null;
  }

  /**
   * Checks if the Node is the Left Child of its Parent.
   */
  public isLeftChild(): boolean {
    return this.parent?.leftChild === this;
  }

  /**
   * Checks if the Node is the Right Child of its Parent.
   */
  public isRightChild(): boolean {
    return this.parent?.rightChild === this;
  }

  /**
   * Returns the **Maximum** Value of the Node.
   */
  public max(): BinarySearchTreeNode<T> {
    let node: BinarySearchTreeNode<T>;
    for (node = this; node.rightChild !== null; node = node.rightChild);
    return node;
  }

  /**
   * Returns the **Minimum** Value of the Node.
   */
  public min(): BinarySearchTreeNode<T> {
    let node: BinarySearchTreeNode<T>;
    for (node = this; node.leftChild !== null; node = node.leftChild);
    return node;
  }

  /**
   * Performs a Left Rotation on the Node.
   *
   * @example
   *
   * // Left Rotation of the Node 8.
   *
   *   7                7
   * 0   8       => 0       10
   *       10             8    12
   *          12
   */
  public rotateLeft(): void {
    const { rightChild } = this;

    if (rightChild !== null) {
      if (rightChild.leftChild !== null) {
        rightChild.leftChild.parent = this;
      }

      this.rightChild = rightChild.leftChild;

      rightChild.leftChild = this;
      rightChild.parent = this.parent;

      if (this.parent !== null) {
        const result = compare(this.parent.item, rightChild.item);
        this.parent[result < 0 ? 'rightChild' : 'leftChild'] = rightChild;
      }
    }

    this.parent = rightChild;
  }

  /**
   * Performs a Right Rotation on the Node.
   *
   * @example
   *
   * // Right Rotation of the Node 8.
   *
   *       10             10
   *     8    12 =>   6        12
   *   6            4   8
   * 4
   */
  public rotateRight(): void {
    const { leftChild } = this;

    if (leftChild !== null) {
      if (leftChild.rightChild !== null) {
        leftChild.rightChild.parent = this;
      }

      this.leftChild = leftChild.rightChild;

      leftChild.rightChild = this;
      leftChild.parent = this.parent;

      if (this.parent !== null) {
        const result = compare(this.parent.item, leftChild.item);
        this.parent[result < 0 ? 'rightChild' : 'leftChild'] = leftChild;
      }
    }

    this.parent = leftChild;
  }
}
