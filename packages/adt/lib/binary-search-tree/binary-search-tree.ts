import { Objects } from '@guarani/utils/objects'
import { Nullable } from '@guarani/utils/types'

import util from 'util'

import { constants } from '../constants'
import { BinarySearchTreeNode } from './binary-search-tree-node'

util.inspect.defaultOptions = {
  depth: 256
}

/**
 * Implementation of a Binary Search Tree.
 */
export class BinarySearchTree<T> {
  /**
   * Root Node of the Binary Tree.
   */
  protected root?: Nullable<BinarySearchTreeNode<T>>

  /**
   * Returns the height of the Binary Search Tree.
   */
  public get height(): number {
    return this.root != null ? this.root.height : 0
  }

  /**
   * Binary Search Tree Node Factory.
   *
   * @param item Item represented by the Node.
   * @returns Newly created Node.
   */
  protected createNode<T>(item: T): BinarySearchTreeNode<T> {
    return new BinarySearchTreeNode<T>(item)
  }

  /**
   * Inserts the provided item into the Binary Tree.
   *
   * @param item Item to be inserted into the Binary Tree.
   */
  public insert(item: T): void {
    if (this.root == null) {
      this.root = this.createNode(item)
    } else {
      this.insertRecursive(this.root, item)
    }
  }

  /**
   * Finds the item that satisfies the predicate.
   *
   * @param predicate Function used to find the requested item.
   * @returns Item that satisfies the predicate.
   */
  public find(predicate: (item: T) => number): Nullable<T> {
    return this.findRecursive(this.root, predicate)
  }

  /**
   * Deletes the provided item from the Binary Tree.
   *
   * @param item Item to be deleted from the Binary Tree.
   */
  public delete(item: T): void {
    this.deleteRecursive(this.root, item)
  }

  /**
   * Traverses the Binary Tree and runs the callback function in each value.
   *
   * @param mode Mode of the traversion of the Binary Tree.
   * @param callback Callback function to be executed in each value.
   */
  public traverse(
    mode: constants.TraversalMode,
    callback: (item: T) => void
  ): void {
    if (this.root != null) {
      this.traverseNode(this.root, mode, callback)
    }
  }

  /**
   * Returns the **minimum** value of the Binary Tree.
   */
  public min(): Nullable<T> {
    if (this.root != null) {
      return this.minimumValueOfNode(this.root)
    }
  }

  /**
   * Returns the **maximum** value of the Binary Tree.
   */
  public max(): Nullable<T> {
    if (this.root != null) {
      return this.maximumValueOfNode(this.root)
    }
  }

  /**
   * Handles the recursive nature of the insertion into a Binary Search Tree.
   *
   * @param node Node from where to start the recursive insertion.
   * @param item Item to be inserted.
   */
  protected insertRecursive(node: BinarySearchTreeNode<T>, item: T): void {
    const comparisonResult = Objects.compare(item, node.item)

    switch (comparisonResult) {
      case 0:
        throw new Error('This item is already at the Binary Tree.')

      case -1:
        if (node.hasLeft()) {
          this.insertRecursive(node.left!, item)
        } else {
          node.left = this.createNode(item)
          node.left.parent = node
        }

        return

      case 1:
        if (node.hasRight()) {
          this.insertRecursive(node.right!, item)
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
   * Handles the recursive nature of the item search on a Binary Search Tree.
   *
   * @param node Node from where to start the recursive search.
   * @param predicate Function used to find the requested item.
   * @returns Item that satisfies the predicate.
   */
  protected findRecursive(
    node: Nullable<BinarySearchTreeNode<T>>,
    predicate: (item: T) => number
  ): Nullable<T> {
    if (node == null) {
      return undefined
    }

    const result = predicate(node.item)

    switch (result) {
      case 0:
        return node.item

      case -1:
        return this.findRecursive(node.left, predicate)

      case 1:
        return this.findRecursive(node.right, predicate)

      default:
        throw new Error('Unknown error.')
    }
  }

  /**
   * Handles the recursive nature of deletion from a Binary Search Tree.
   *
   * @param node Node from where to start the recursive deletion.
   * @param item Item to be deleted.
   */
  protected deleteRecursive(
    node: Nullable<BinarySearchTreeNode<T>>,
    item: T
  ): void {
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
        return

      case 1:
        this.deleteRecursive(node.right, item)
        return

      default:
        throw new Error('Unknown Error.')
    }
  }

  /**
   * Searches for the **minimum** value starting from the provided node.
   *
   * @param node Node from where to start searching for the minimum value.
   * @returns Minimum value of the Node.
   */
  protected minimumValueOfNode(node: BinarySearchTreeNode<T>): Nullable<T> {
    return !node.hasLeft() ? node.item : this.minimumValueOfNode(node.left!)
  }

  /**
   * Searches for the **maximum** value starting from the provided node.
   *
   * @param node Node from where to start searching for the maximum value.
   * @returns Maximum value of the Node.
   */
  protected maximumValueOfNode(node: BinarySearchTreeNode<T>): Nullable<T> {
    return !node.hasRight() ? node.item : this.maximumValueOfNode(node.right!)
  }

  /**
   * Recursively traverses the provided node.
   *
   * @param node Node from where to start the traversion.
   * @param mode Mode of the traversion of the Binary Search Tree.
   * @param callback Callback function to be executed in each value.
   */
  protected traverseNode<T>(
    node: Nullable<BinarySearchTreeNode<T>>,
    mode: constants.TraversalMode,
    callback: (item: T) => void
  ): void {
    if (node == null) {
      return
    }

    switch (mode) {
      case constants.TraversalMode.InOrder:
        this.traverseNode(node.left, mode, callback)
        callback(node.item)
        this.traverseNode(node.right, mode, callback)

        break

      case constants.TraversalMode.PreOrder:
        callback(node.item)
        this.traverseNode(node.left, mode, callback)
        this.traverseNode(node.right, mode, callback)

        break

      case constants.TraversalMode.PostOrder:
        this.traverseNode(node.left, mode, callback)
        this.traverseNode(node.right, mode, callback)
        callback(node.item)

        break

      default:
        throw new TypeError(`Unsupported traversal mode "${mode}".`)
    }
  }

  /**
   * Handles the deletion of the provided node.
   *
   * @param node Node from where to start the deletion.
   */
  protected _deleteNode(node: BinarySearchTreeNode<T>): void {
    // Deleting a leaf node.
    if (node.isLeaf()) {
      if (node.isRoot()) {
        this.root = undefined
      } else if (node.parent!.left === node) {
        node.parent!.left = undefined
      } else if (node.parent!.right === node) {
        node.parent!.right = undefined
      } else {
        throw new Error('Unknown Error.')
      }
    }

    // Deleting a node with only a left child.
    else if (!node.hasRight()) {
      if (node.isRoot()) {
        this.root = node.left!
      } else if (node.parent!.left === node) {
        node.parent!.left = node.left
      } else if (node.parent!.right === node) {
        node.parent!.right = node.left
      }

      node.left!.parent = node.parent
    }

    // Deleting a node with only a right child.
    else if (!node.hasLeft()) {
      if (node.isRoot()) {
        this.root = node.right!
      } else if (node.parent!.left === node) {
        node.parent!.left = node.right
      } else if (node.parent!.right === node) {
        node.parent!.right = node.right
      }

      node.right!.parent = node.parent
    }

    // Deleting a node with two children.
    else {
      const inOrderSuccessor = this.minimumValueOfNode(node.right!)!

      node.item = inOrderSuccessor

      this.deleteRecursive(node.right, inOrderSuccessor)
    }
  }

  /**
   * Describes the format of the Binary Search Tree.
   */
  public [util.inspect.custom](): any {
    const comparator = (node: Nullable<BinarySearchTreeNode<T>>): any => {
      if (node == null) {
        return undefined
      }

      if (node.isLeaf()) {
        return { item: node.item }
      }

      return {
        item: node.item,
        left: comparator(node.left),
        right: comparator(node.right)
      }
    }

    return comparator(this.root)
  }
}
