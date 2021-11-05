import { Nullable } from '@guarani/utils/types'

/**
 * Implementation of a Node of the Binary Search Tree.
 */
export class BinarySearchTreeNode<T> {
  /**
   * Item represented by the Node.
   */
  public item: T

  /**
   * Parent Node.
   */
  public parent?: Nullable<BinarySearchTreeNode<T>>

  /**
   * Left child Node.
   */
  public left?: Nullable<BinarySearchTreeNode<T>>

  /**
   * Right child Node.
   */
  public right?: Nullable<BinarySearchTreeNode<T>>

  /**
   * Instantiates a new Binary Tree Node.
   *
   * @param item Item represented by the Node.
   */
  public constructor(item: T) {
    this.item = item
  }

  /**
   * Returns the height of the Node.
   */
  public get height(): number {
    const leftHeight = this.left?.height ?? -1
    const rightHeight = this.right?.height ?? -1

    return 1 + Math.max(leftHeight, rightHeight)
  }

  /**
   * Checks if the Node has a parent Node.
   */
  public hasParent(): boolean {
    return this.parent != null
  }

  /**
   * Checks if the Node has a left sub-tree.
   */
  public hasLeft(): boolean {
    return this.left != null
  }

  /**
   * Checks if the Node has a right sub-tree.
   */
  public hasRight(): boolean {
    return this.right != null
  }

  /**
   * Checks if the Node is a Root Node.
   */
  public isRoot(): boolean {
    return !this.hasParent()
  }

  /**
   * Checks if the Node is a Leaf Node.
   */
  public isLeaf(): boolean {
    return !this.hasLeft() && !this.hasRight()
  }
}
