import { compare } from '@guarani/objects';
import { Nullable } from '@guarani/types';

import util from 'util';

import { BinarySearchTree } from '../binary-search-tree/binary-search-tree';
import { RedBlackColor } from './red-black-color';
import { RedBlackTreeNode } from './red-black-tree-node';

/**
 * Implementation of a Red Black Tree.
 */
export class RedBlackTree<T> extends BinarySearchTree<T> {
  /**
   * Root Node of the Red Black Tree.
   */
  protected root: Nullable<RedBlackTreeNode<T>> = null;

  /**
   * Inserts the provided Item into the Red Black Tree.
   *
   * @param item Item to be inserted into the Red Black Tree.
   */
  public insert(item: T): void {
    if (this.root === null) {
      this.root = new RedBlackTreeNode<T>(item);
      this._length += 1;

      this.repaintInsert(this.root);
    } else {
      this.insertRecursive(this.root, item);

      if (this.root.parent !== null) {
        this.root = this.root.parent;
      }

      if (this.root.color !== RedBlackColor.Black) {
        this.repaintInsert(this.root);
      }
    }
  }

  /**
   * Deletes the provided Item from the Red Black Tree.
   *
   * @param item Item to be deleted from the Red Black Tree.
   * @returns Result of the deletion.
   */
  public delete(item: T): boolean {
    return this.deleteRecursive(this.root, item);
  }

  /**
   * Handles the recursive nature of the insertion into a Red Black Tree,
   * as well as its balancing and coloring requirements.
   *
   * @param node Node from where to start the recursive insertion.
   * @param item Item to be inserted.
   */
  protected insertRecursive(node: RedBlackTreeNode<T>, item: T): void {
    const comparisonResult = compare(item, node.item);

    switch (comparisonResult) {
      case 0:
        return;

      case -1:
        if (node.leftChild !== null) {
          this.insertRecursive(node.leftChild, item);
        } else {
          node.leftChild = new RedBlackTreeNode<T>(item);
          node.leftChild.parent = node;

          this._length += 1;
          this.repaintInsert(node.leftChild);
        }

        return;

      case 1:
        if (node.rightChild !== null) {
          this.insertRecursive(node.rightChild, item);
        } else {
          node.rightChild = new RedBlackTreeNode<T>(item);
          node.rightChild.parent = node;

          this._length += 1;
          this.repaintInsert(node.rightChild);
        }

        return;

      default:
        throw new Error('Comparison returned an unexpected value.');
    }
  }

  /**
   * Handles the recursive nature of deletion from a Red Black Tree.
   *
   * @param node Node from where to start the recursive deletion.
   * @param item Item to be deleted.
   * @returns Result of the deletion.
   */
  protected deleteRecursive(node: Nullable<RedBlackTreeNode<T>>, item: T): boolean {
    if (node === null) {
      return false;
    }

    const comparisonResult = compare(item, node.item);

    switch (comparisonResult) {
      case 0:
        this.deleteNode(node);
        return true;

      case -1:
        return this.deleteRecursive(node.leftChild, item);

      case 1:
        return this.deleteRecursive(node.rightChild, item);

      default:
        throw new Error('Comparison returned an unexpected value.');
    }
  }

  /**
   * Handles the deletion of the provided Node.
   *
   * @param node Node from where to start the deletion.
   */
  protected deleteNode(node: RedBlackTreeNode<T>): void {
    let pivot: Nullable<RedBlackTreeNode<T>> = null;
    let { color } = node;

    // Deleting a node with zero or one child.
    if (!node.hasLeftChild() || !node.hasRightChild()) {
      pivot = this.deleteNodeWithZeroOrOneChild(node);
    }

    // Deleting a node with two children.
    else {
      [pivot, color] = this.deleteNodeWithTwoChildren(node);
    }

    // Deleting a black node causes a double red condition.
    if (color === RedBlackColor.Black) {
      this.repaintDelete(pivot);

      if (pivot instanceof RedBlackTreeNode.NIL) {
        this.transplant(null, pivot);
      }
    }
  }

  /**
   * Repaints the newly inserted Node.
   *
   * @param node Node to be repainted.
   */
  private repaintInsert(node: RedBlackTreeNode<T>): void {
    if (node === null) {
      return;
    }

    let { parent } = node;

    // Inserted the root.
    if (parent === null) {
      node.color = RedBlackColor.Black;
      return;
    }

    // The parent is the root.
    if (parent.color === RedBlackColor.Black) {
      return;
    }

    const { grandParent } = node;

    // The parent is the root and we force it black.
    if (grandParent === null) {
      parent.color = RedBlackColor.Black;
      return;
    }

    const { uncle } = node;

    // Uncle is red.
    if (uncle !== null && uncle.color === RedBlackColor.Red) {
      parent.color = RedBlackColor.Black;
      uncle.color = RedBlackColor.Black;
      grandParent.color = RedBlackColor.Red;

      this.repaintInsert(grandParent);
    }

    /* From here on the uncle is black. */

    // Uncle is black and right.
    else if (parent.isLeftChild()) {
      if (node.isRightChild()) {
        parent.rotateLeft();
        parent = node;
      }

      grandParent.rotateRight();

      parent.color = RedBlackColor.Black;
      grandParent.color = RedBlackColor.Red;
    }

    // Uncle is black and left.
    else if (parent.isRightChild()) {
      if (node.isLeftChild()) {
        parent.rotateRight();
        parent = node;
      }

      grandParent.rotateLeft();

      parent.color = RedBlackColor.Black;
      grandParent.color = RedBlackColor.Red;
    }
  }

  /**
   * Repaints the transplanted Pivot Node after a deletion.
   *
   * @param pivot Pivot Node to be repainted.
   */
  private repaintDelete(pivot: Nullable<RedBlackTreeNode<T>>): void {
    if (pivot === null) {
      return;
    }

    // Pivot is red.
    if (pivot.color === RedBlackColor.Red) {
      pivot.color = RedBlackColor.Black;
      return;
    }

    /* From here on, the Pivot is black. */

    // When this happens, it is pretty much done.
    if (pivot.sibling === null) {
      return;
    }

    let sibling = pivot.sibling;

    // Sibling is red.
    if (sibling.color === RedBlackColor.Red) {
      sibling.color = RedBlackColor.Black;
      pivot.parent!.color = RedBlackColor.Red;

      if (pivot.isLeftChild()) {
        pivot.parent!.rotateLeft();

        sibling = pivot.parent!.rightChild!;
      } else {
        pivot.parent!.rotateRight();

        sibling = pivot.parent!.leftChild!;
      }
    }

    /* From here on the sibling is black. */

    // Sibling's children are both black.
    if (sibling.leftChild?.color !== RedBlackColor.Red && sibling.rightChild?.color !== RedBlackColor.Red) {
      sibling.color = RedBlackColor.Red;

      pivot = pivot.parent!;

      if (pivot.color === RedBlackColor.Red) {
        pivot.color = RedBlackColor.Black;
      }
    }

    /* At least one of Sibling's child is red. */

    // Pivot is the left child.
    else if (pivot.isLeftChild()) {
      // Sibling's right child is black and left child is red.
      if (sibling.rightChild?.color !== RedBlackColor.Red) {
        sibling.leftChild!.color = RedBlackColor.Black;
        sibling.color = RedBlackColor.Red;

        sibling.rotateRight();

        sibling = pivot.parent!.rightChild!;
      }

      // Sibling's right child is red.
      sibling.color = pivot.parent!.color;
      pivot.parent!.color = RedBlackColor.Black;
      sibling.rightChild!.color = RedBlackColor.Black;

      pivot.parent!.rotateLeft();
    }

    // Pivot is the right child.
    else if (pivot.isRightChild()) {
      // Sibling's left child is black and right child is red.
      if (sibling.leftChild?.color !== RedBlackColor.Red) {
        sibling.rightChild!.color = RedBlackColor.Black;
        sibling.color = RedBlackColor.Red;

        sibling.rotateLeft();

        sibling = pivot.parent!.leftChild!;
      }

      // Sibling's left child is red.
      sibling.color = pivot.parent!.color;
      pivot.parent!.color = RedBlackColor.Black;
      sibling.leftChild!.color = RedBlackColor.Black;

      pivot.parent!.rotateRight();
    }

    // Node to be deleted is black and InOrder Successor is `null`.
    if (pivot instanceof RedBlackTreeNode.NIL) {
      pivot.parent![pivot.isLeftChild() ? 'leftChild' : 'rightChild'] = null;
    }
  }

  /**
   * Deletes a Node with either zero or one child and returns
   * the Node transplanted in its place.
   *
   * @param node Node to be deleted.
   * @returns Node transplanted in place of the deleted one.
   */
  private deleteNodeWithZeroOrOneChild(node: RedBlackTreeNode<T>): Nullable<RedBlackTreeNode<T>> {
    let pivot: Nullable<RedBlackTreeNode<T>> = null;

    // Deleting a node with only a left child.
    if (node.hasLeftChild()) {
      pivot = node.leftChild;
    }

    // Deleting a node with only a right child.
    else if (node.hasRightChild()) {
      pivot = node.rightChild;
    }

    // Deleting a leaf node.
    else {
      pivot = node.color === RedBlackColor.Black ? new RedBlackTreeNode.NIL(node) : null;
    }

    this.transplant(pivot, node);
    this._length -= 1;

    return pivot;
  }

  /**
   * Deletes a Node with two children and returns its In-Order Successor.
   *
   * @param node Node to be deleted.
   * @returns Tuple with the Pivot Node and the color of the In-Order Successor.
   */
  private deleteNodeWithTwoChildren(node: RedBlackTreeNode<T>): [Nullable<RedBlackTreeNode<T>>, RedBlackColor] {
    const inOrderSuccessor = <RedBlackTreeNode<T>>node.rightChild!.min();

    const pivot =
      inOrderSuccessor.color === RedBlackColor.Red
        ? inOrderSuccessor.rightChild
        : inOrderSuccessor.rightChild ?? new RedBlackTreeNode.NIL(inOrderSuccessor);

    Reflect.set(node, 'item', inOrderSuccessor.item);

    this.deleteRecursive(node.rightChild, inOrderSuccessor.item);

    return [pivot, inOrderSuccessor.color];
  }

  /**
   * Representation of the Red Black Tree.
   */
  public [util.inspect.custom]() {
    const comparator = (node: Nullable<RedBlackTreeNode<T>>): any => {
      if (node === null) {
        return null;
      }

      if (node.isLeaf()) {
        return { data: node.item, color: node.color };
      }

      return {
        data: node.item,
        color: node.color,
        left: comparator(node.leftChild),
        right: comparator(node.rightChild),
      };
    };

    return comparator(this.root);
  }
}
