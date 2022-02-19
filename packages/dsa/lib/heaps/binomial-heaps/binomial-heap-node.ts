import { Nullable } from '@guarani/types';

/**
 * Implementation of a Node of the Binomial Heap.
 */
export class BinomialHeapNode<T> {
  /**
   * Item represented by the Node.
   */
  // Makes the item appear first when util.inspect()'ing the Node.
  public item: T = null!;

  /**
   * Order of the Node.
   */
  public order: number = 0;

  /**
   * Parent Node.
   */
  private _parent: Nullable<BinomialHeapNode<T>> = null;

  /**
   * Sibling Node.
   */
  private _sibling: Nullable<BinomialHeapNode<T>> = null;

  /**
   * Child Node.
   */
  private _child: Nullable<BinomialHeapNode<T>> = null;

  /**
   * Parent Node.
   */
  public get parent(): Nullable<BinomialHeapNode<T>> {
    return this._parent;
  }

  /**
   * Sibling Node.
   */
  public get sibling(): Nullable<BinomialHeapNode<T>> {
    return this._sibling;
  }

  /**
   * Child Node.
   */
  public get child(): Nullable<BinomialHeapNode<T>> {
    return this._child;
  }

  /**
   * Instantiates a new Binomial Heap Node.
   *
   * @param item Item represented by the Node.
   */
  public constructor(item: T) {
    this.item = item;
  }

  /**
   * Checks if the Node is the Direct Child of its Parent.
   */
  public isChild(): boolean {
    return this.parent?._child === this;
  }

  /**
   * Links a Binomial Tree as a child of the current Binomial Tree,
   * provided that both trees have the same order.
   *
   * @param other Binomial Tree to be linked.
   * @throws {Error} The orders of the Nodes are different.
   */
  public linkTree(other: BinomialHeapNode<T>): void {
    if (this.order !== other.order) {
      throw new Error(`Cannot link trees of orders ${this.order} and ${other.order}.`);
    }

    other._parent = this;
    other._sibling = this._child;

    this._child = other;
    this.order += 1;
  }
}
