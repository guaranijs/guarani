import { Objects } from '@guarani/utils/objects'
import { Nullable } from '@guarani/utils/types'

import { BinarySearchTree } from '../binary-search-tree'
import { AvlTreeNode } from './avl-tree-node'

/**
 * Implementation of an Avl Tree.
 */
export class AvlTree<T> extends BinarySearchTree<T> {
  /**
   * Root Node of the Avl Tree.
   */
  protected root?: Nullable<AvlTreeNode<T>>

  /**
   * Avl Tree Node Factory.
   *
   * @param item Item represented by the Node.
   * @returns Newly created Node.
   */
  protected createNode<T>(item: T): AvlTreeNode<T> {
    return new AvlTreeNode<T>(item)
  }

  /**
   * Handles the recursive nature of the insertion into an Avl Tree,
   * as well as its balancing requirement.
   *
   * @param node Node from where to start the recursive insertion.
   * @param item Item to be inserted.
   */
  protected insertRecursive(node: AvlTreeNode<T>, item: T): void {
    const comparisonResult = Objects.compare(item, node.item)

    switch (comparisonResult) {
      case 0:
        throw new Error('This item is already at the Avl Tree.')

      case -1:
        if (node.hasLeft()) {
          this.insertRecursive(node.left!, item)
          this.balance(node)
        } else {
          node.left = this.createNode(item)
          node.left.parent = node
        }

        return

      case 1:
        if (node.hasRight()) {
          this.insertRecursive(node.right!, item)
          this.balance(node)
        } else {
          node.right = this.createNode(item)
          node.right.parent = node
        }

        return

      default:
        throw new TypeError('Invalid comparison result.')
    }
  }

  /**
   * Handles the recursive nature of deletion from an Avl Tree,
   * as well as its balancing requirement.
   *
   * @param node Node from where to start the recursive deletion.
   * @param item Item to be deleted.
   */
  protected deleteRecursive(node: Nullable<AvlTreeNode<T>>, item: T): void {
    if (node == null) {
      return
    }

    const comparisonResult = Objects.compare(item, node.item)

    switch (comparisonResult) {
      case 0:
        this._deleteNode(node)
        return

      case -1:
        this.deleteRecursive(node.left, item)
        this.balance(node)

        return

      case 1:
        this.deleteRecursive(node.right, item)
        this.balance(node)

        return

      default:
        throw new Error('Unknown Error.')
    }
  }

  /**
   * Balances the Node's left or right child through the use of Rotations.
   *
   * @param node Node to be balanced.
   */
  private balance(node: Nullable<AvlTreeNode<T>>): void {
    if (node == null) {
      return
    }

    const nodeWasBalanced = node.isBalanced()

    if (node.balance > 1) {
      if (node.left!.hasLeft()) {
        node.rotateRight()
      } else if (node.left!.hasRight()) {
        node.rotateLeftRight()
      }
    } else if (node.balance < -1) {
      if (node.right!.hasRight()) {
        node.rotateLeft()
      } else if (node.right!.hasLeft()) {
        node.rotateRightLeft()
      }
    }

    if (!nodeWasBalanced && this.root === node) {
      this.root = node.parent
    }
  }
}
