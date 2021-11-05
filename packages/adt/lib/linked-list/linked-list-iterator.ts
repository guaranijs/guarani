import { Nullable } from '@guarani/utils/types'

import { LinkedListNode } from './linked-list-node'

/**
 * Iterator over the items of a Linked List.
 */
export class LinkedListIterator<T>
  implements Iterator<T>, IteratorReturnResult<Nullable<T>> {
  public done!: true
  public value!: Nullable<T>
  public node?: Nullable<LinkedListNode<T>>

  public constructor(node: Nullable<LinkedListNode<T>>) {
    this.node = node
  }

  // Move the `Iterator` to the next item.
  public next(): IteratorResult<T> {
    this.value = this.node?.item
    // @ts-ignore
    this.done = this.node == null
    this.node = this.node?.next

    return this
  }
}
