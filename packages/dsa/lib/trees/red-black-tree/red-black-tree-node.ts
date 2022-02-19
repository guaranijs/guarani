import { Nullable } from '@guarani/types';

import { BinarySearchTreeNode } from '../binary-search-tree/binary-search-tree-node';
import { RedBlackColor } from './red-black-color';

/**
 * Implementation of a Node of the Red Black Tree.
 */
export class RedBlackTreeNode<T> extends BinarySearchTreeNode<T> {
  /**
   * Parent Node.
   */
  public parent: Nullable<RedBlackTreeNode<T>> = null;

  /**
   * Left child Node.
   */
  public leftChild: Nullable<RedBlackTreeNode<T>> = null;

  /**
   * Right child Node.
   */
  public rightChild: Nullable<RedBlackTreeNode<T>> = null;

  /**
   * Color of the Node.
   */
  public color: RedBlackColor = RedBlackColor.Red;

  /**
   * Grand Parent of the Node.
   */
  public get grandParent(): Nullable<RedBlackTreeNode<T>> {
    return this.parent?.parent ?? null;
  }

  /**
   * Uncle of the Node.
   */
  public get uncle(): Nullable<RedBlackTreeNode<T>> {
    if (this.parent?.isLeftChild() === true) {
      return this.grandParent!.rightChild;
    }

    if (this.parent?.isRightChild() === true) {
      return this.grandParent!.leftChild;
    }

    return null;
  }

  /**
   * Sibling of the Node.
   */
  public get sibling(): Nullable<RedBlackTreeNode<T>> {
    if (this.isLeftChild()) {
      return this.parent!.rightChild;
    }

    if (this.isRightChild()) {
      return this.parent!.leftChild;
    }

    return null;
  }

  /**
   * The NIL Node is a special Node that is used as a supporting Node
   * when deleting a Node from the Red Black Tree.
   *
   * Its color is **ALWAYS** Black.
   */
  public static readonly NIL = class NIL<T> extends RedBlackTreeNode<T> {
    public constructor(parent: RedBlackTreeNode<T>) {
      super(null!);

      this.parent = parent;
      this.color = RedBlackColor.Black;
    }
  };

  /**
   * Checks if the Node has a Left Sub-Tree.
   */
  public hasLeftChild(): boolean {
    return this.leftChild !== null && !(this.leftChild instanceof RedBlackTreeNode.NIL);
  }

  /**
   * Checks if the Node has a Right Sub-Tree.
   */
  public hasRightChild(): boolean {
    return this.rightChild !== null && !(this.rightChild instanceof RedBlackTreeNode.NIL);
  }
}
