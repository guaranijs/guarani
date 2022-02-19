import { Nullable } from '@guarani/types';

import util from 'util';

import { LinkedList } from './linked-list';

/**
 * Implementation of a Node of the Linked List.
 */
export class LinkedListNode<T> {
  /**
   * Linked List to which the Node pertains.
   */
  private _list: LinkedList<T> = null!;

  /**
   * Previous Node.
   */
  private _previous: Nullable<LinkedListNode<T>> = null;

  /**
   * Next Node.
   */
  private _next: Nullable<LinkedListNode<T>> = null;

  /**
   * Item represented by the Node.
   */
  public item: T;

  /**
   * Linked List to which the Node pertains.
   */
  public get list(): LinkedList<T> {
    return this._list;
  }

  /**
   * Previous Node.
   */
  public get previous(): Nullable<LinkedListNode<T>> {
    return this._previous;
  }

  /**
   * Next Node.
   */
  public get next(): Nullable<LinkedListNode<T>> {
    return this._next;
  }

  /**
   * Instantiates a new Linked List Node.
   *
   * @param item Item represented by the Node.
   */
  public constructor(item: T) {
    this.item = item;
  }

  /**
   * Representation of the LinkedListNode.
   */
  public [util.inspect.custom]() {
    return this.item;
  }
}
