import { compare } from '@guarani/objects';
import { Nullable, Optional } from '@guarani/types';

import util from 'util';

import { Queue } from '../../queue';
import { BinarySearchTreeNode } from './binary-search-tree-node';

util.inspect.defaultOptions = {
  depth: 256,
};

/**
 * Implementation of a Binary Search Tree.
 */
export class BinarySearchTree<T> {
  /**
   * Root Node of the Binary Search Tree.
   */
  protected root: Nullable<BinarySearchTreeNode<T>> = null;

  /**
   * Number of Nodes in the Binary Search Tree.
   */
  protected _length: number = 0;

  /**
   * Height of the Binary Search Tree.
   */
  public get height(): number {
    return this.root?.height ?? 0;
  }

  /**
   * Number of Nodes in the Binary Search Tree.
   */
  public get length(): number {
    return this._length;
  }

  /**
   * Instantiates a new Binary Search Tree.
   *
   * @param items Optional initial Items of the Binary Search Tree.
   */
  public constructor(items?: Optional<Iterable<T>>) {
    if (items !== undefined) {
      for (const item of items) {
        this.insert(item);
      }
    }
  }

  /**
   * Checks if the Binary Search Tree is empty.
   */
  public isEmpty(): boolean {
    return this.root === null;
  }

  /**
   * Inserts the provided Item into the Binary Search Tree.
   *
   * @param item Item to be inserted into the Binary Search Tree.
   */
  public insert(item: T): void {
    if (this.root === null) {
      this.root = new BinarySearchTreeNode<T>(item);
      this._length += 1;
    } else {
      this.insertRecursive(this.root, item);
    }
  }

  /**
   * Searches the Binary Search Tree for an Item
   * that satisfies the provided predicate.
   *
   * @param predicate Predicate function used to find the requested Item.
   */
  public find(predicate: (item: T) => number): Nullable<T> {
    return this.findRecursive(this.root, predicate);
  }

  /**
   * Deletes the provided Item from the Binary Search Tree.
   *
   * @param item Item to be deleted from the Binary Search Tree.
   * @returns Result of the deletion.
   */
  public delete(item: T): boolean {
    return this.deleteRecursive(this.root, item);
  }

  /**
   * Checks if the provided Item is present at the Binary Search Tree.
   *
   * @param item Item to be checked.
   */
  public contains(item: T): boolean {
    return this.find((node) => compare(item, node)) !== null;
  }

  /**
   * Returns the **Minimum** Item of the Binary Search Tree.
   */
  public min(): Nullable<T> {
    return this.root?.min().item ?? null;
  }

  /**
   * Returns the **Maximum** Item of the Binary Search Tree.
   */
  public max(): Nullable<T> {
    return this.root?.max().item ?? null;
  }

  /**
   * Performs a Level-Order traversal on the Binary Search Tree.
   *
   * @param callback Callback function to be executed on each Item.
   */
  public levelOrder(callback: (item: T) => void): void {
    if (this.root === null) {
      return;
    }

    const queue = new Queue([this.root]);

    while (!queue.isEmpty()) {
      const node = queue.dequeue()!;

      callback(node.item);

      if (node.leftChild !== null) {
        queue.enqueue(node.leftChild);
      }

      if (node.rightChild !== null) {
        queue.enqueue(node.rightChild);
      }
    }
  }

  /**
   * Performs an In-Order traversal on the Binary Search Tree
   * using Morris' Algorithm.
   *
   * @param callback Callback function to be executed on each Item.
   */
  public inOrder(callback: (item: T) => void): void {
    if (this.root === null) {
      return;
    }

    let inOrderPredecessor: Nullable<BinarySearchTreeNode<T>>;
    let current: Nullable<BinarySearchTreeNode<T>> = this.root;

    while (current !== null) {
      if (current.leftChild === null) {
        callback(current.item);
        current = current.rightChild;
      } else {
        inOrderPredecessor = current.leftChild;

        while (inOrderPredecessor.rightChild !== null && inOrderPredecessor.rightChild !== current) {
          inOrderPredecessor = inOrderPredecessor.rightChild;
        }

        if (inOrderPredecessor.rightChild === null) {
          inOrderPredecessor.rightChild = current;
          current = current.leftChild;
        } else {
          inOrderPredecessor.rightChild = null;
          callback(current.item);
          current = current.rightChild;
        }
      }
    }
  }

  /**
   * Performs a Pre-Order traversal on the Binary Search Tree
   * using a modified version of Morris' Algorithm.
   *
   * @param callback Callback function to be executed on each Item.
   */
  public preOrder(callback: (item: T) => void): void {
    if (this.root === null) {
      return;
    }

    let current: Nullable<BinarySearchTreeNode<T>> = this.root;
    let inOrderPredecessor: BinarySearchTreeNode<T>;

    while (current !== null) {
      if (current.leftChild === null) {
        callback(current.item);
        current = current.rightChild;
      } else {
        inOrderPredecessor = current.leftChild;

        while (inOrderPredecessor.rightChild !== null && inOrderPredecessor.rightChild !== current) {
          inOrderPredecessor = inOrderPredecessor.rightChild;
        }

        if (inOrderPredecessor.rightChild === current) {
          inOrderPredecessor.rightChild = null;
          current = current.rightChild;
        } else {
          callback(current.item);
          inOrderPredecessor.rightChild = current;
          current = current.leftChild;
        }
      }
    }
  }

  /**
   * Performs a Post-Order traversal on the Binary Search Tree
   * using a modified version of Morris' Algorithm.
   *
   * @param callback Callback function to be executed on each Item.
   */
  public postOrder(callback: (item: T) => void): void {
    if (this.root === null) {
      return;
    }

    const dummy = new BinarySearchTreeNode<T>(null!);
    dummy.leftChild = this.root;

    let current: Nullable<BinarySearchTreeNode<T>> = dummy;
    let predecessor: BinarySearchTreeNode<T>;
    let first: Nullable<BinarySearchTreeNode<T>>;
    let middle: BinarySearchTreeNode<T>;
    let last: Nullable<BinarySearchTreeNode<T>>;

    while (current !== null) {
      if (current.leftChild === null) {
        current = current.rightChild;
      } else {
        predecessor = current.leftChild;
        while (predecessor.rightChild !== null && predecessor.rightChild !== current) {
          predecessor = predecessor.rightChild;
        }

        if (predecessor.rightChild === null) {
          predecessor.rightChild = current;
          current = current.leftChild;
        } else {
          first = current;
          middle = current.leftChild;

          while (middle !== current) {
            last = middle.rightChild;
            middle.rightChild = first;
            first = middle;
            middle = last!;
          }

          first = current;
          middle = predecessor;

          while (middle !== current) {
            callback(middle.item);
            last = middle.rightChild;
            middle.rightChild = first;
            first = middle;
            middle = last!;
          }

          predecessor.rightChild = null;

          current = current.rightChild;
        }
      }
    }
  }

  /**
   * Clears the Binary Search Tree.
   */
  public clear(): void {
    this.root = null;
    this._length = 0;
  }

  /**
   * Handles the recursive nature of the insertion into a Binary Search Tree.
   *
   * @param node Node from where to start the recursive insertion.
   * @param item Item to be inserted.
   */
  protected insertRecursive(node: BinarySearchTreeNode<T>, item: T): void {
    const comparisonResult = compare(item, node.item);

    switch (comparisonResult) {
      case 0:
        return;

      case -1:
        if (node.leftChild !== null) {
          this.insertRecursive(node.leftChild, item);
        } else {
          node.leftChild = new BinarySearchTreeNode<T>(item);
          node.leftChild.parent = node;

          this._length += 1;
        }

        return;

      case 1:
        if (node.rightChild !== null) {
          this.insertRecursive(node.rightChild, item);
        } else {
          node.rightChild = new BinarySearchTreeNode<T>(item);
          node.rightChild.parent = node;

          this._length += 1;
        }

        return;

      default:
        throw new Error('Comparison returned an unexpected value.');
    }
  }

  /**
   * Handles the recursive nature of searching over a Binary Search Tree.
   *
   * @param node Node from where to start the recursive search.
   * @param predicate Predicate function used to find the requested Item.
   */
  protected findRecursive(node: Nullable<BinarySearchTreeNode<T>>, predicate: (item: T) => number): Nullable<T> {
    if (node === null) {
      return null;
    }

    switch (predicate(node.item)) {
      case 0:
        return node.item;

      case -1:
        return this.findRecursive(node.leftChild, predicate);

      case 1:
        return this.findRecursive(node.rightChild, predicate);

      default:
        throw new Error('Comparison returned an unexpected value.');
    }
  }

  /**
   * Handles the recursive nature of deleting from a Binary Search Tree.
   *
   * @param node Node from where to start the recursive deletion.
   * @param item Item to be deleted.
   * @returns Result of the deletion.
   */
  protected deleteRecursive(node: Nullable<BinarySearchTreeNode<T>>, item: T): boolean {
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
   * Handles the deletion of the provided node.
   *
   * @param node Node from where to start the deletion.
   */
  protected deleteNode(node: BinarySearchTreeNode<T>): void {
    // Deleting a node with only a left child.
    if (node.rightChild === null) {
      this.transplant(node.leftChild, node);
    }

    // Deleting a node with only a right child.
    else if (node.leftChild === null) {
      this.transplant(node.rightChild, node);
    }

    // Deleting a node with two children.
    else {
      const inOrderSuccessor = node.rightChild.min();
      Reflect.set(node, 'item', inOrderSuccessor.item);
      this.transplant(inOrderSuccessor.rightChild, inOrderSuccessor);
    }

    this._length -= 1;
  }

  /**
   * Transplants the Source Node into the Target Node's Left or Right Child.
   *
   * @param source Node to be transplanted.
   * @param target Node that will be replaced by the transplanted Node.
   */
  protected transplant(source: Nullable<BinarySearchTreeNode<T>>, target: BinarySearchTreeNode<T>): void {
    if (target.parent === null) {
      this.root = source;
    } else if (target.isLeftChild()) {
      target.parent.leftChild = source;
    } else if (target.isRightChild()) {
      target.parent.rightChild = source;
    }

    // The target could be a Leaf Node.
    if (source !== null) {
      source.parent = target.parent;
    }

    target.parent = null;
  }

  /**
   * Representation of the Binary Search Tree.
   */
  public [util.inspect.custom]() {
    const comparator = (node: Nullable<BinarySearchTreeNode<T>>): any => {
      if (node === null) {
        return;
      }

      if (node.isLeaf()) {
        return { data: node.item };
      }

      return {
        data: node.item,
        left: comparator(node.leftChild),
        right: comparator(node.rightChild),
      };
    };

    return comparator(this.root);
  }
}
