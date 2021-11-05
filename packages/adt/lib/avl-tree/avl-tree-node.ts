import { Objects } from '@guarani/utils/objects'
import { Nullable } from '@guarani/utils/types'

import { BinarySearchTreeNode } from '../binary-search-tree'

/**
 * Implementation of a Node of the Avl Tree.
 */
export class AvlTreeNode<T> extends BinarySearchTreeNode<T> {
  /**
   * Parent Node.
   */
  public parent?: Nullable<AvlTreeNode<T>>

  /**
   * Left child Node.
   */
  public left?: Nullable<AvlTreeNode<T>>

  /**
   * Right child Node.
   */
  public right?: Nullable<AvlTreeNode<T>>

  /**
   * Returns the Balance Factor of the Node.
   */
  public get balance(): number {
    const leftHeight = this.left?.height ?? 0
    const rightHeight = this.right?.height ?? 0

    return leftHeight - rightHeight
  }

  /**
   * Checks if the Node is balanced.
   */
  public isBalanced(): boolean {
    return this.balance >= -1 && this.balance <= 1
  }

  /**
   * Performs a Left Rotation on the Node.
   */
  public rotateLeft(): void {
    const right = this.right

    if (right != null) {
      if (right.hasLeft()) {
        right.left!.parent = this
      }

      this.right = right.left!

      right.left = this
      right.parent = this.parent

      if (this.hasParent()) {
        const result = Objects.compare(this.parent!.item, right.item)
        this.parent![result < 0 ? 'right' : 'left'] = right
      }
    }

    this.parent = right
  }

  /**
   * Performs a Right Rotation on the Node.
   */
  public rotateRight(): void {
    const left = this.left

    if (left != null) {
      if (left.hasRight()) {
        left.right!.parent = this
      }

      this.left = left.right!

      left.right = this
      left.parent = this.parent

      if (this.hasParent()) {
        const result = Objects.compare(this.parent!.item, left.item)
        this.parent![result < 0 ? 'right' : 'left'] = left
      }
    }

    this.parent = left
  }

  /**
   * Performs a Left Rotation on the Node's left child
   * and a Right Rotation on the Node.
   */
  public rotateLeftRight(): void {
    if (this.hasLeft()) {
      this.left!.rotateLeft()
    }

    this.rotateRight()
  }

  /**
   * Performs a Right Rotation on the Node's right child
   * and a Left Rotation on the Node.
   */
  public rotateRightLeft(): void {
    if (this.hasRight()) {
      this.right!.rotateRight()
    }

    this.rotateLeft()
  }
}
