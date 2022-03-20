import { compare } from '@guarani/objects';
import { Nullable } from '@guarani/types';

import { BinarySearchTree } from '../binary-search-tree/binary-search-tree';
import { AvlTreeNode } from './avl-tree-node';

/**
 * Implementation of an Avl Tree.
 */
export class AvlTree<T> extends BinarySearchTree<T> {
  /**
   * Root Node of the Avl Tree.
   */
  protected root: Nullable<AvlTreeNode<T>> = null;

  /**
   * Inserts the provided Item into the Avl Tree.
   *
   * @param item Item to be inserted into the Avl Tree.
   */
  public insert(item: T): void {
    if (this.root === null) {
      this.root = new AvlTreeNode<T>(item);
      this._length += 1;
    } else {
      this.insertRecursive(this.root, item);
    }
  }

  /**
   * Deletes the provided Item from the Avl Tree.
   *
   * @param item Item to be deleted from the Avl Tree.
   * @returns Result of the deletion.
   */
  public delete(item: T): boolean {
    return this.deleteRecursive(this.root, item);
  }

  /**
   * Handles the recursive nature of the insertion into a Avl Tree.
   *
   * @param node Node from where to start the recursive insertion.
   * @param item Item to be inserted.
   */
  protected insertRecursive(node: AvlTreeNode<T>, item: T): void {
    const comparisonResult = compare(item, node.item);

    switch (comparisonResult) {
      case 0:
        return;

      case -1:
        if (node.leftChild !== null) {
          this.insertRecursive(node.leftChild, item);
        } else {
          node.leftChild = new AvlTreeNode<T>(item);
          node.leftChild = node;

          this._length += 1;
        }

        this.balance(node);
        return;

      case 1:
        if (node.rightChild !== null) {
          this.insertRecursive(node.rightChild, item);
        } else {
          node.rightChild = new AvlTreeNode<T>(item);
          node.rightChild = node;

          this._length += 1;
        }

        this.balance(node);
        return;

      default:
        throw new Error('Comparison returned an unexpected value.');
    }
  }

  /**
   * Handles the recursive nature of deleting from a Avl Tree.
   *
   * @param node Node from where to start the recursive deletion.
   * @param item Item to be deleted.
   * @returns Result of the deletion.
   */
  protected deleteRecursive(node: Nullable<AvlTreeNode<T>>, item: T): boolean {
    if (node === null) {
      return false;
    }

    const comparisonResult = compare(item, node.item);

    switch (comparisonResult) {
      case 0:
        this.deleteNode(node);
        return true;

      case -1: {
        const result = this.deleteRecursive(node.leftChild, item);
        this.balance(node);
        return result;
      }

      case 1: {
        const result = this.deleteRecursive(node.rightChild, item);
        this.balance(node);
        return result;
      }

      default:
        throw new Error('Comparison returned an unexpected value.');
    }
  }

  /**
   * Handles the deletion of the provided Node.
   *
   * @param node Node from where to start the deletion.
   */
  protected deleteNode(node: AvlTreeNode<T>): void {
    // Deleting a node with only a left child.
    if (node.rightChild === null) {
      this.transplant(node.leftChild, node);
      this._length -= 1;
    }

    // Deleting a node with only a right child.
    else if (node.leftChild === null) {
      this.transplant(node.rightChild, node);
      this._length -= 1;
    }

    // Deleting a node with two children.
    else {
      const inOrderSuccessor = <AvlTreeNode<T>>node.rightChild.min();
      Reflect.set(node, 'item', inOrderSuccessor.item);
      this.deleteRecursive(node.rightChild, inOrderSuccessor.item);
    }
  }

  /**
   * Balances the Node's Left or Right Child through the use of Rotations.
   *
   * @param node Node to be balanced.
   */
  private balance(node: AvlTreeNode<T>): void {
    const nodeWasBalanced = node.isBalanced();

    if (node.balance > 1) {
      if (node.leftChild!.leftChild !== null) {
        node.rotateRight();
      } else if (node.leftChild!.rightChild !== null) {
        node.rotateLeftRight();
      }
    } else if (node.balance < -1) {
      if (node.rightChild!.rightChild !== null) {
        node.rotateLeft();
      } else if (node.rightChild!.leftChild !== null) {
        node.rotateRightLeft();
      }
    }

    if (!nodeWasBalanced && this.root === node) {
      this.root = node.parent;
    }
  }
}
