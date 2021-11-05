import { Objects } from '@guarani/utils/objects'
import { Nullable } from '@guarani/utils/types'

import util from 'util'

import { LinkedListIterator } from './linked-list-iterator'
import { LinkedListNode } from './linked-list-node'

/**
 * Implementation of a Doubly Linked List.
 */
export class LinkedList<T> implements Iterable<T> {
  /**
   * Head LinkedListNode of the Linked List.
   */
  private head?: Nullable<LinkedListNode<T>>

  /**
   * Tail LinkedListNode of the Linked List.
   */
  private tail?: Nullable<LinkedListNode<T>>

  /**
   * Length of the Linked List.
   */
  private _length: number = 0

  /**
   * Creates a Linked List with the values of the provided array.
   *
   * @param array Array used to create the Linked List.
   * @returns Linked List based on the provided array.
   */
  public static from<U>(array: U[]): LinkedList<U> {
    const linkedList = new LinkedList<U>()

    array.forEach(element => linkedList.add(element))

    return linkedList
  }

  /**
   * Creates a Linked List with the values of the provided items.
   *
   * @param items Items used to create the Linked List.
   * @returns Linked List based on the provided items.
   */
  public static of<U>(...items: U[]): LinkedList<U> {
    return this.from(items)
  }

  /**
   * Length of the Linked List.
   */
  public get length(): number {
    return this._length
  }

  /**
   * Length of the Linked List.
   */
  private set length(length: number) {
    this._length = length
  }

  /**
   * Adds an item at the tail of the Linked List.
   *
   * @param item Item to be added at the tail of the Linked List.
   */
  public add(item: T): LinkedList<T>

  /**
   * Adds an item at the specified index of the Linked List.
   *
   * @param item Item to be added to the Linked List.
   * @param index Position that the item will be inserted.
   */
  public add(item: T, index: number): LinkedList<T>

  /**
   * Adds an item into the Linked List, optionally specified by the index.
   *
   * @param item Item to be added to the Linked List.
   * @param index Optional position that the item will be inserted.
   */
  public add(item: T, index?: number): LinkedList<T> {
    if (index === 0) {
      return this.addHead(item)
    }

    if (index == null || index >= this.length) {
      return this.addTail(item)
    }

    const node = new LinkedListNode<T>(item)

    let i = 0
    let currentNode = this.head!

    while (i < index) {
      currentNode = currentNode.next!
      i += 1
    }

    node.prev = currentNode
    node.next = currentNode.next
    node.next!.prev = node
    currentNode.next = node

    this.length += 1

    return this
  }

  /**
   * Adds an item at the head of the Linked List.
   *
   * @param item Item to be added at the head of the Linked List.
   */
  public addHead(item: T): LinkedList<T> {
    const node = new LinkedListNode<T>(item)

    if (this.length === 0) {
      this.tail = node
    } else if (this.length === 1) {
      node.next = this.tail
      this.tail!.prev = node
    } else {
      node.next = this.head
      this.head!.prev = node
    }

    this.head = node
    this.length += 1

    return this
  }

  /**
   * Adds an item at the tail of the Linked List.
   *
   * @param item Item to be added at the tail of the Linked List.
   */
  public addTail(item: T): LinkedList<T> {
    const node = new LinkedListNode<T>(item)

    if (this.length === 0) {
      this.head = node
    } else if (this.length === 1) {
      node.prev = this.head
      this.head!.next = node
    } else {
      node.prev = this.tail
      this.tail!.next = node
    }

    this.tail = node
    this.length += 1

    return this
  }

  /**
   * Searches for an item that fullfils the provided predicate.
   *
   * @param predicate Predicate used to find the desired item.
   * @returns Item that matches the predicate.
   */
  public find(predicate: (item: T, index?: number) => boolean): Nullable<T> {
    let i = 0

    for (const item of this) {
      if (predicate(item, i)) {
        return item
      }

      i += 1
    }
  }

  /**
   * Returns the item at the requested index of the Linked List.
   *
   * If the index is positive, it searches the Linked List from the head.
   * If the index is negative, it searches the Linked List from the tail.
   *
   * @param index Index of the Linked List.
   * @returns Item at the requested index of the Linked List.
   */
  public at(index: number): Nullable<T> {
    if (this.length === 0) {
      return
    }

    let node: Nullable<LinkedListNode<T>>

    if (index < 0) {
      node = this.tail

      for (
        let i = this.length - 1;
        i >= this.length + index + 1;
        i--, node = node?.prev
      );
    } else {
      node = this.head

      for (let i = 0; i < index; i++, node = node?.next);
    }

    return node?.item
  }

  /**
   * Returns the index of the provided item at the Linked List.
   *
   * @param item Item of the Linked List.
   * @returns Index of the provided item.
   */
  public indexOf(item: T): number {
    let i = 0

    for (const nodeItem of this) {
      if (Objects.compare(item, nodeItem) === 0) {
        return i
      }

      i += 1
    }

    return -1
  }

  /**
   * Updates the item at the provided index.
   *
   * @param index Index of the item to be updated.
   * @param item New item to be inserted at the provided index.
   */
  public update(index: number, item: T): LinkedList<T> {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`Invalid index ${index}.`)
    }

    let node = this.head

    for (let i = 0; i < index; i += 1, node = node?.next);

    if (node != null) {
      node.item = item
    }

    return this
  }

  /**
   * Deletes an item from the Linked List.
   *
   * @param item Item to be deleted.
   */
  public delete(item: T): LinkedList<T> {
    if (this.length === 0) {
      return this
    }

    if (this.length === 1) {
      if (Objects.compare(item, this.head!.item) === 0) {
        // TODO: Check whether all checks are really necessary.
        this.head!.prev = undefined
        this.head!.next = undefined
        this.tail!.prev = undefined
        this.tail!.next = undefined

        this.head = undefined
        this.tail = undefined

        this.length = 0
      }

      return this
    }

    for (
      let i = 0, node = this.head;
      i < this.length;
      i += 1, node = node?.next
    ) {
      if (Objects.compare(item, node?.item) !== 0) {
        continue
      }

      // Deleting the head.
      if (i === 0) {
        const newHead = this.head!.next!
        this.head!.next = undefined
        newHead.prev = undefined

        this.head = newHead
      }

      // Deleting the tail.
      else if (i === this.length - 1) {
        const newTail = this.tail!.prev!
        this.tail!.prev = undefined
        newTail.next = undefined

        this.tail = newTail
      }

      // Deleting in the middle.
      else {
        node!.prev!.next = node!.next
        node!.next!.prev = node!.prev

        node!.prev = undefined
        node!.next = undefined
      }

      this.length -= 1

      break
    }

    return this
  }

  /**
   * Deletes the item located at the provided index on the Linked List.
   *
   * @param index Index of the item to be deleted from the Linked List.
   */
  // TODO: Improve this by removing the 2 * O(n) calls.
  public deleteAt(index: number): LinkedList<T> {
    const item = this.at(index)

    if (item != null) {
      this.delete(item)
    }

    return this
  }

  /**
   * Clears the Linked List.
   */
  public clear(): LinkedList<T> {
    if (this.length === 0) {
      return this
    }

    let node = this.head

    while (node?.next != null) {
      node = node.next
      node.prev!.next = undefined
      node.prev = undefined
    }

    this.head = undefined
    this.tail = undefined
    this.length = 0

    return this
  }

  /**
   * Creates a Linked List with the reversed items of the current Linked List.
   */
  public reverse(): LinkedList<T> {
    const linkedList = new LinkedList<T>()

    for (const item of this) {
      linkedList.addHead(item)
    }

    return linkedList
  }

  /**
   * Executes the provided callback function on each item of the Linked List.
   *
   * @param callback Callback function to be executed on each item.
   */
  public forEach(callback: (item: T, index?: number) => void): void {
    for (
      let node = this.head, index = 0;
      node != null;
      node = node.next, index += 1
    ) {
      callback(node.item, index)
    }
  }

  /**
   * Filters the Linked List based on the items that pass the predicate check.
   *
   * @param predicate Predicate function used to filter the Linked List.
   */
  public filter(predicate: (item: T, index?: number) => boolean): LinkedList<T>

  /**
   * Filters the Linked List based on the items that pass the predicate check.
   *
   * @param predicate Predicate function used to filter the Linked List.
   */
  public filter<U extends T>(
    predicate: (item: T, index?: number) => item is U
  ): LinkedList<U>

  /**
   * Filters the Linked List based on the items that pass the predicate check.
   *
   * @param predicate Predicate function used to filter the Linked List.
   */
  public filter<U extends T = T>(
    predicate: (item: T, index?: number) => boolean
  ): LinkedList<U> {
    const list = new LinkedList<U>()

    this.forEach((item, index) => {
      if (predicate(item, index) === true) {
        list.add(<U>item)
      }
    })

    return list
  }

  /**
   * Maps a callback function on each item of the Linked List
   * and returns a new Linked List based on the results.
   *
   * @param callback Callback function used to map each item of the Linked List.
   * @returns New Linked List based on the mapped items.
   */
  public map<U>(callback: (item: T, index?: number) => U): LinkedList<U> {
    const list = new LinkedList<U>()

    this.forEach((item, index) => list.add(callback(item, index)))

    return list
  }

  /**
   * Returns the array representation of the Linked List.
   */
  public toArray(): T[] {
    return [...this]
  }

  /**
   * Returns an iterator over the items of the Linked List.
   */
  public [Symbol.iterator](): Iterator<T> {
    return new LinkedListIterator(this.head)
  }

  /**
   * Describes the format of the Linked List.
   */
  public [util.inspect.custom]() {
    return this.toArray()
  }
}
