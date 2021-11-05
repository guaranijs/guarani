import { Objects } from '@guarani/utils/objects'
import { Nullable } from '@guarani/utils/types'

import { BinarySearchTree } from '../binary-search-tree'
import { RB_COLOR } from '../constants'
import { RedBlackTreeNode } from './red-black-tree-node'

export class RedBlackTree<T> extends BinarySearchTree<T> {
  /**
   * Root Node of the Red Black Tree.
   */
  protected root?: Nullable<RedBlackTreeNode<T>>

  /**
   * Red Black Tree Node Factory.
   *
   * @param item Item represented by the Node.
   * @returns Newly created Node.
   */
  protected createNode<T>(item: T): RedBlackTreeNode<T> {
    return new RedBlackTreeNode<T>(item)
  }

  /**
   * Inserts the provided item into the Red Black Tree.
   *
   * @param item Item to be inserted into the Red Black Tree.
   */
  public insert(item: T): void {
    if (this.root == null) {
      this.root = this.createNode(item)

      this.repaint(this.root)
    } else {
      this.insertRecursive(this.root, item)
    }
  }

  /**
   * Handles the recursive nature of the insertion into a Red Black Tree,
   * as well as its balancing and coloring requirements.
   *
   * @param node Node from where to start the recursive insertion.
   * @param item Item to be inserted.
   */
  protected insertRecursive(node: RedBlackTreeNode<T>, item: T): void {
    const comparisonResult = Objects.compare(item, node.item)

    switch (comparisonResult) {
      case 0:
        throw new Error('This item is already at the Red Black Tree.')

      case -1:
        if (node.hasLeft()) {
          this.insertRecursive(node.left!, item)
          this.repaint(node)
        } else {
          node.left = this.createNode(item)
          node.left.parent = node
        }

        return

      case 1:
        if (node.hasRight()) {
          this.insertRecursive(node.right!, item)
          this.repaint(node)
        } else {
          node.right = this.createNode(item)
          node.right.parent = node
        }

        return

      default:
        throw new TypeError('Invalid comparison result.')
    }
  }

  private repaint(node: RedBlackTreeNode<T>): void {
    const { parent } = node

    if (parent == null) {
      node.color = RB_COLOR.Black
      return
    }

    if (parent.color === RB_COLOR.Black) {
      return
    }

    const grandParent = parent.parent

    if (grandParent == null) {
      return
    }

    const { uncle } = parent

    // Uncle is red.
    if (uncle != null && uncle.color === RB_COLOR.Red) {
      parent.color = RB_COLOR.Black
      uncle.color = RB_COLOR.Black
      grandParent.color = RB_COLOR.Red

      this.repaint(grandParent)
    }
  }
}
