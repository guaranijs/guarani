import { Nullable } from '@guarani/utils/types'

import { BinarySearchTreeNode } from '../binary-search-tree'
import { RB_COLOR } from '../constants'

export class RedBlackTreeNode<T> extends BinarySearchTreeNode<T> {
  /**
   * Parent Node.
   */
  public parent?: Nullable<RedBlackTreeNode<T>>

  /**
   * Left child Node.
   */
  public left?: Nullable<RedBlackTreeNode<T>>

  /**
   * Right child Node.
   */
  public right?: Nullable<RedBlackTreeNode<T>>

  /**
   * Color of the Node.
   */
  public color: RB_COLOR = RB_COLOR.Red

  /**
   * Returns the Uncle of the Node.
   */
  public get uncle(): Nullable<RedBlackTreeNode<T>> {
    const parent = this.parent!

    if (parent.left === this) {
      return parent.right
    }

    if (parent.right === this) {
      return parent.left
    }
  }

  public get blackHeight(): number {
    const leftBlackHeight = this.left?.blackHeight ?? 0
    const rightBlackHeight = this.right?.blackHeight ?? 0

    return Math.max(leftBlackHeight, rightBlackHeight)
  }

  public rotateLeft(): void {}

  public rotateRight(): void {}
}
