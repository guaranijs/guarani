import { Nullable } from '@guarani/utils/types'

/**
 * Implementation of a Node of the Linked List.
 */
export class LinkedListNode<T> {
  /**
   * Item represented by the Node.
   */
  public item: T

  /**
   * Previous Node.
   */
  public prev?: Nullable<LinkedListNode<T>>

  /**
   * Next Node.
   */
  public next?: Nullable<LinkedListNode<T>>

  /**
   * Instantiates a new Linked List Node.
   *
   * @param item Item represented by the Node.
   */
  public constructor(item: T) {
    this.item = item
  }
}
