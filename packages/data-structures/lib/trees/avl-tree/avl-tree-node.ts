import { Nullable } from '@guarani/types';

import { BinarySearchTreeNode } from '../binary-search-tree/binary-search-tree-node';

/**
 * Implementation of a Node of the Avl Tree.
 */
export class AvlTreeNode<T> extends BinarySearchTreeNode<T> {
  /**
   * Parent Node.
   */
  public parent: Nullable<AvlTreeNode<T>> = null;

  /**
   * Left Child Node.
   */
  public leftChild: Nullable<AvlTreeNode<T>> = null;

  /**
   * Right Child Node.
   */
  public rightChild: Nullable<AvlTreeNode<T>> = null;

  /**
   * Balance Factor of the Node.
   */
  public get balance(): number {
    const leftChildHeight = this.leftChild?.height ?? 0;
    const rightChildHeight = this.rightChild?.height ?? 0;

    return leftChildHeight - rightChildHeight;
  }

  /**
   * Checks if the Node is balanced.
   */
  public isBalanced(): boolean {
    return this.balance >= -1 && this.balance <= 1;
  }

  /**
   * Performs a Left Rotation on the Node's Left Child
   * and a Right Rotation on the Node.
   */
  public rotateLeftRight(): void {
    if (this.leftChild !== null) {
      this.leftChild.rotateLeft();
    }

    this.rotateRight();
  }

  /**
   * Performs a Right Rotation on the Node's Right Child
   * and a Left Rotation on the Node.
   */
  public rotateRightLeft(): void {
    if (this.rightChild !== null) {
      this.rightChild.rotateRight();
    }

    this.rotateLeft();
  }
}
