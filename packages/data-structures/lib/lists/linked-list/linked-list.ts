import { compare } from '@guarani/objects';
import { Comparable, Nullable, Optional } from '@guarani/types';

import util from 'util';

import { LinkedListNode } from './linked-list-node';

/**
 * Implementation of a Linked List.
 */
export class LinkedList<T> implements Comparable<LinkedList<T>>, Iterable<T> {
  /**
   * Length of the Linked List.
   */
  private _length: number = 0;

  /**
   * Head of the Linked List.
   */
  private _head: Nullable<LinkedListNode<T>> = null;

  /**
   * Tail of the Linked List.
   */
  private _tail: Nullable<LinkedListNode<T>> = null;

  /**
   * Length of the Linked List.
   */
  public get length(): number {
    return this._length;
  }

  /**
   * Head of the Linked List.
   */
  public get head(): Nullable<LinkedListNode<T>> {
    return this._head;
  }

  /**
   * Tail of the Linked List.
   */
  public get tail(): Nullable<LinkedListNode<T>> {
    return this._tail;
  }

  /**
   * Instantiates a new Linked List.
   *
   * @param items Optional initial Items of the Linked List.
   */
  public constructor(items?: Optional<Iterable<T>>) {
    if (items !== undefined) {
      for (const item of items) {
        this.insertLast(item);
      }
    }
  }

  /**
   * Checks if the Linked List if empty.
   */
  public isEmpty(): boolean {
    return this._length === 0;
  }

  /**
   * Inserts the provided Item at the Head of the Linked List.
   *
   * @param item Item to be inserted at the Head of the Linked List.
   * @returns Reference to the newly inserted Node.
   */
  public insertFirst(item: T): LinkedListNode<T>;

  /**
   * Inserts the provided Node at the Head of the Linked List.
   *
   * @param node Node to be inserted at the Head of the Linked List.
   */
  public insertFirst(node: LinkedListNode<T>): void;

  /**
   * Inserts the provided Element at the Head of the Linked List.
   *
   * @param itemOrNode Element to be inserted at the Head of the Linked List.
   * @returns Reference to the **newly** inserted Node.
   */
  public insertFirst(itemOrNode: T | LinkedListNode<T>): LinkedListNode<T> | void {
    const node = this.createNode(itemOrNode);

    this.setNextNode(node, this._head);

    if (this._head !== null) {
      this.setPreviousNode(this._head, node);
    }

    if (this._tail === null) {
      this._tail = node;
    }

    this._head = node;
    this._length += 1;

    if (!(itemOrNode instanceof LinkedListNode)) {
      return node;
    }
  }

  /**
   * Inserts the provided Item at the Tail of the Linked List.
   *
   * @param item Item to be inserted at the Tail of the Linked List.
   * @returns Reference to the newly inserted Node.
   */
  public insertLast(item: T): LinkedListNode<T>;

  /**
   * Inserts the provided Node at the Tail of the Linked List.
   *
   * @param node Node to be inserted at the Tail of the Linked List.
   */
  public insertLast(node: LinkedListNode<T>): void;

  /**
   * Inserts the provided Element at the Tail of the Linked List.
   *
   * @param itemOrNode Element to be inserted at the Tail of the Linked List.
   * @returns Reference to the **newly** inserted Node.
   */
  public insertLast(itemOrNode: T | LinkedListNode<T>): LinkedListNode<T> | void {
    const node = this.createNode(itemOrNode);

    this.setPreviousNode(node, this._tail);

    if (this._tail !== null) {
      this.setNextNode(this._tail, node);
    }

    if (this._head === null) {
      this._head = node;
    }

    this._tail = node;
    this._length += 1;

    if (!(itemOrNode instanceof LinkedListNode)) {
      return node;
    }
  }

  /**
   * Inserts the provided Item before the provided Pivot Node.
   *
   * @param item Item to be inserted.
   * @param pivot Pivot Node that will guide the insertion of the Item.
   * @returns Reference to the newly inserted Node.
   */
  public insertBefore(item: T, pivot: LinkedListNode<T>): LinkedListNode<T>;

  /**
   * Inserts the provided Node before the provided Pivot Node.
   *
   * @param node Node to be inserted.
   * @param pivot Pivot Node that will guide the insertion of the Node.
   */
  public insertBefore(node: LinkedListNode<T>, pivot: LinkedListNode<T>): void;

  /**
   * Inserts the provided Element before the provided Pivot Node.
   *
   * @param itemOrNode Element to be inserted.
   * @param pivot Pivot Node that will guide the insertion of the Element.
   * @returns Reference to the **newly** inserted Node.
   */
  public insertBefore(itemOrNode: T | LinkedListNode<T>, pivot: LinkedListNode<T>): LinkedListNode<T> | void {
    if (pivot.list !== this) {
      throw new Error('The Pivot does not pertain to this Linked List.');
    }

    const node = this.createNode(itemOrNode);

    this.setPreviousNode(node, pivot.previous);
    this.setNextNode(node, pivot);

    if (pivot.previous !== null) {
      this.setNextNode(pivot.previous, node);
    }

    this.setPreviousNode(pivot, node);

    if (this._head === pivot) {
      this._head = node;
    }

    this._length += 1;

    if (!(itemOrNode instanceof LinkedListNode)) {
      return node;
    }
  }

  /**
   * Inserts the provided Item after the provided Pivot Node.
   *
   * @param item Item to be inserted.
   * @param pivot Pivot Node that will guide the insertion of the Item.
   * @returns Reference to the newly inserted Node.
   */
  public insertAfter(item: T, pivot: LinkedListNode<T>): LinkedListNode<T>;

  /**
   * Inserts the provided Node after the provided Pivot Node.
   *
   * @param node Node to be inserted.
   * @param pivot Pivot Node that will guide the insertion of the Node.
   */
  public insertAfter(node: LinkedListNode<T>, pivot: LinkedListNode<T>): void;

  /**
   * Inserts the provided Element after the provided Pivot Node.
   *
   * @param itemOrNode Element to be inserted.
   * @param pivot Pivot Node that will guide the insertion of the Element.
   * @returns Reference to the **newly** inserted Node.
   */
  public insertAfter(itemOrNode: T | LinkedListNode<T>, pivot: LinkedListNode<T>): LinkedListNode<T> | void {
    if (pivot.list !== this) {
      throw new Error('The Pivot does not pertain to this Linked List.');
    }

    const node = this.createNode(itemOrNode);

    this.setPreviousNode(node, pivot);
    this.setNextNode(node, pivot.next);

    if (pivot.next !== null) {
      this.setPreviousNode(pivot.next, node);
    }

    this.setNextNode(pivot, node);

    if (this._tail === pivot) {
      this._tail = node;
    }

    this._length += 1;

    if (!(itemOrNode instanceof LinkedListNode)) {
      return node;
    }
  }

  /**
   * Inserts the provided Item at the provided index.
   *
   * @param item Item to be inserted.
   * @param index Position that the Item will be inserted.
   * @returns Reference to the newly inserted Node.
   */
  public insertAt(item: T, index: number): LinkedListNode<T>;

  /**
   * Inserts the provided Node at the provided index.
   *
   * @param node Node to be inserted.
   * @param index Position that the Node will be inserted.
   */
  public insertAt(node: LinkedListNode<T>, index: number): void;

  /**
   * Inserts the provided Element at the provided index.
   *
   * @param itemOrNode Element to be inserted.
   * @param index Position that the Element will be inserted.
   * @returns Reference to the **newly** inserted Node.
   */
  public insertAt(itemOrNode: T | LinkedListNode<T>, index: number): LinkedListNode<T> | void {
    const position = this.calculatePosition(index);

    if (position < 0 || position > this._length) {
      throw new RangeError(`Invalid index ${index}.`);
    }

    // Special case: Insertion at the Head.
    if (position === 0) {
      return this.insertFirst(<any>itemOrNode);
    }

    // Special case: Insertion at the Tail.
    if (position === this._length) {
      return this.insertLast(<any>itemOrNode);
    }

    // Normal case: Insertion at the middle.
    const pivot = this.get(position);
    const node = this.createNode(itemOrNode);

    this.setPreviousNode(node, pivot.previous);
    this.setNextNode(node, pivot);

    this.setNextNode(pivot.previous!, node);
    this.setPreviousNode(pivot, node);

    this._length += 1;

    if (!(itemOrNode instanceof LinkedListNode)) {
      return node;
    }
  }

  /**
   * Searches the Linked List for the first occurrence of the provided Item.
   *
   * @param predicate Predicate function used to find the requested Item.
   * @returns Node that represents the first occurrence of the provided Item.
   */
  public find(predicate: (item: T) => boolean): Nullable<LinkedListNode<T>> {
    for (let node = this._head; node !== null; node = node.next) {
      if (predicate(node.item)) {
        return node;
      }
    }

    return null;
  }

  /**
   * Searches the Linked List for the last occurrence of the provided Item.
   *
   * @param predicate Predicate function used to find the requested Item.
   * @returns Node that represents the last occurrence of the provided Item.
   */
  public findLast(predicate: (item: T) => boolean): Nullable<LinkedListNode<T>> {
    for (let node = this._tail; node !== null; node = node.previous) {
      if (predicate(node.item)) {
        return node;
      }
    }

    return null;
  }

  /**
   * Returns the Node at the requested index of the Linked List.
   *
   * @param index Index of the Linked List.
   * @returns Node at the requested index of the Linked List.
   */
  public get(index: number): LinkedListNode<T> {
    if (this.isEmpty()) {
      throw new RangeError(`Invalid index ${index}.`);
    }

    const position = this.calculatePosition(index);

    if (position < 0 || position >= this._length) {
      throw new RangeError(`Invalid index ${index}.`);
    }

    let tmp: LinkedListNode<T>;
    const middleIndex = Math.floor(this._length / 2);

    // Search from the _head.
    if (position <= middleIndex) {
      tmp = this._head!;
      for (let i = 0; i < position; i += 1, tmp = tmp.next!);
    }

    // Search from the _tail.
    else {
      tmp = this._tail!;
      for (let i = this._length - 1; i > position; i -= 1, tmp = tmp.previous!);
    }

    return tmp;
  }

  /**
   * Returns the index of the provided Item at the Linked List.
   *
   * @param item Item to be searched.
   * @returns Index of the provided Item.
   */
  public indexOf(item: T): Nullable<number>;

  /**
   * Returns the index of the provided Node at the Linked List.
   *
   * @param node Node to be searched.
   * @returns Index of the provided Node.
   */
  public indexOf(node: LinkedListNode<T>): Nullable<number>;

  /**
   * Returns the index of the provided Element at the Linked List.
   *
   * @param itemOrNode Element of the Linked List.
   * @returns Index of the provided Element.
   */
  public indexOf(itemOrNode: T | LinkedListNode<T>): Nullable<number> {
    if (this.isEmpty()) {
      return null;
    }

    if (itemOrNode instanceof LinkedListNode && itemOrNode.list !== this) {
      throw new Error('The provided Node does not pertain to this Linked List.');
    }

    const data = itemOrNode instanceof LinkedListNode ? itemOrNode.item : itemOrNode;

    for (
      let i = 0, j = this._length - 1, _head = this._head!, _tail = this._tail!;
      j >= i;
      i += 1, j -= 1, _head = _head.next!, _tail = _tail.previous!
    ) {
      if (compare(data, _head.item) === 0) {
        return i;
      }

      if (compare(data, _tail.item) === 0) {
        return j;
      }
    }

    return null;
  }

  /**
   * Updates the Node that represents the provided Item
   * with the new provided Item.
   *
   * @param item Item to be updated.
   * @param newItem New Item that will replace the current Item.
   * @returns Result of the update.
   */
  public update(item: T, newItem: T): boolean;

  /**
   * Replaces the Node that represents the provided Item
   * with the new provided Node.
   *
   * @param item Item to be updated.
   * @param newNode New Node that will replace the Node of the provided Item.
   * @returns Result of the update.
   */
  public update(item: T, newNode: LinkedListNode<T>): boolean;

  /**
   * Updates the Item of the provided Node with the new provided Item.
   *
   * @param node Node to be updated.
   * @param newItem New Item that will replace the current Item of the Node.
   * @returns Result of the update.
   */
  public update(node: LinkedListNode<T>, newItem: T): boolean;

  /**
   * Replaces the provided Node with the new provided Node.
   *
   * @param node Node to be updated.
   * @param newNode New Node that will replace the provided Node.
   * @returns Result of the update.
   */
  public update(node: LinkedListNode<T>, newNode: LinkedListNode<T>): boolean;

  /**
   * Updates or replaces the provided Element with the new provided Element.
   *
   * @param itemOrNode Element to be updated.
   * @param newItemOrNode New Element that will replace the current Element.
   * @returns Result of the update.
   */
  public update(itemOrNode: T | LinkedListNode<T>, newItemOrNode: T | LinkedListNode<T>): boolean {
    if (itemOrNode instanceof LinkedListNode && itemOrNode.list !== this) {
      throw new Error('The provided Node does not pertain to this Linked List.');
    }

    const node =
      itemOrNode instanceof LinkedListNode ? itemOrNode : this.find((item) => compare(item, itemOrNode) === 0);

    if (node === null) {
      return false;
    }

    if (newItemOrNode instanceof LinkedListNode) {
      this.setList(newItemOrNode, this);
      this.setPreviousNode(newItemOrNode, node.previous);
      this.setNextNode(newItemOrNode, node.next);

      if (node.next !== null) {
        this.setPreviousNode(node.next, newItemOrNode);
      }

      if (node.previous !== null) {
        this.setNextNode(node.previous, newItemOrNode);
      }

      this.setPreviousNode(node, null);
      this.setNextNode(node, null);

      if (this._head === node) {
        this._head = newItemOrNode;
      }

      if (this._tail === node) {
        this._tail = newItemOrNode;
      }
    } else {
      node.item = newItemOrNode;
    }

    return true;
  }

  /**
   * Updates the Item at the provided index.
   *
   * @param index Index of the Item to be updated.
   * @param item New Item to be inserted at the provided index.
   */
  public updateAt(index: number, item: T): void;

  /**
   * Updates the Node at the provided index.
   *
   * @param index Index of the Node to be updated.
   * @param node New Node to be inserted at the provided index.
   */
  public updateAt(index: number, node: LinkedListNode<T>): void;

  /**
   * Updates the Element at the provided index.
   *
   * @param index Index of the Element to be updated.
   * @param itemOrNode New Element to be inserted at the provided index.
   */
  public updateAt(index: number, itemOrNode: T | LinkedListNode<T>): void {
    const node = this.get(index);

    if (itemOrNode instanceof LinkedListNode) {
      this.setList(itemOrNode, this);
      this.setPreviousNode(itemOrNode, node.previous);
      this.setNextNode(itemOrNode, node.next);

      if (node.next !== null) {
        this.setPreviousNode(node.next, itemOrNode);
      }

      if (node.previous !== null) {
        this.setNextNode(node.previous, itemOrNode);
      }

      this.setPreviousNode(node, null);
      this.setNextNode(node, null);

      if (this._head === node) {
        this._head = itemOrNode;
      }

      if (this._tail === node) {
        this._tail = itemOrNode;
      }
    } else {
      node.item = itemOrNode;
    }
  }

  /**
   * Deletes the Node at the Head of the Linked List.
   */
  public deleteFirst(): void {
    if (this.isEmpty()) {
      return;
    }

    this.deleteNode(this._head!);
  }

  /**
   * Deletes the Node at the Tail of the Linked List.
   */
  public deleteLast(): void {
    if (this.isEmpty()) {
      return;
    }

    this.deleteNode(this._tail!);
  }

  /**
   * Deletes the first occurrence of the provided Item from the Linked List.
   *
   * @param item Item to be deleted.
   * @returns Result of the deletion.
   */
  public delete(item: T): boolean;

  /**
   * Deletes the provided Node from the Linked List.
   *
   * @param node Node to be deleted.
   */
  public delete(node: LinkedListNode<T>): void;

  /**
   * Deletes the provided Element from the Linked List.
   *
   * @param itemOrNode Element to be deleted.
   * @returns Result of the deletion.
   */
  public delete(itemOrNode: T | LinkedListNode<T>): boolean | void {
    if (this.isEmpty()) {
      return itemOrNode instanceof LinkedListNode ? undefined : false;
    }

    if (itemOrNode instanceof LinkedListNode && itemOrNode.list !== this) {
      throw new Error('The provided Node does not pertain to this Linked List.');
    }

    const node =
      itemOrNode instanceof LinkedListNode ? itemOrNode : this.find((item) => compare(item, itemOrNode) === 0);

    if (node === null) {
      return false;
    }

    this.deleteNode(node);

    if (!(itemOrNode instanceof LinkedListNode)) {
      return true;
    }
  }

  /**
   * Deletes the Node located at the provided index on the Linked List.
   *
   * @param index Index of the Node to be deleted from the Linked List.
   */
  public deleteAt(index: number): void {
    if (this.isEmpty()) {
      return;
    }

    const node = this.get(index);

    this.deleteNode(node);
  }

  /**
   * Clears the Linked List.
   */
  public clear(): void {
    this._head = this._tail = null;
    this._length = 0;
  }

  /**
   * Reverses the Linked List in-place.
   */
  public reverse(): void {
    if (this.isEmpty() || this._length === 1) {
      return;
    }

    for (let node = this._head; node !== null; node = node.previous) {
      const tmp = node.previous;

      this.setPreviousNode(node, node.next);
      this.setNextNode(node, tmp);
    }

    const _head = this._head;

    this._head = this._tail;
    this._tail = _head;
  }

  /**
   * Sorts the elements of the Linked List.
   *
   * @param comparator Three-way comparison function to determine
   * the order of the sorted Linked List.
   */
  // Bottom-Up Merge Sort.
  public sort(comparator: (left: T, right: T) => number = compare): void {
    if (this.isEmpty() || this._length === 1) {
      return;
    }

    let start1: Nullable<LinkedListNode<T>> = null;
    let start2: Nullable<LinkedListNode<T>> = null;
    let end1: Nullable<LinkedListNode<T>> = null;
    let end2: Nullable<LinkedListNode<T>> = null;
    let prevEnd: LinkedListNode<T>;

    for (let interval = 1; interval < this._length; interval *= 2) {
      start1 = this._head;

      while (start1 !== null) {
        const firstIteration = start1 === this._head;

        let counter = interval - 1;
        for (end1 = start1; counter > 0 && end1.next !== null; counter -= 1, end1 = end1.next);

        start2 = end1.next;

        if (start2 === null) {
          break;
        }

        this.setNextNode(end1, null);
        this.setPreviousNode(start2, null);

        counter = interval - 1;
        for (end2 = start2; counter > 0 && end2.next !== null; counter -= 1, end2 = end2.next);

        const nextStart = end2.next;

        if (nextStart !== null) {
          this.setPreviousNode(nextStart, null);
        }

        this.setNextNode(end2, null);

        const [_head, _tail] = this.merge(start1, start2, comparator);

        this.setNextNode(_tail, nextStart);

        if (firstIteration) {
          this._head = _head;
        } else {
          this.setNextNode(prevEnd!, _head);
        }

        this._tail = prevEnd = _tail;
        start1 = nextStart;
      }

      this.setNextNode(prevEnd!, start1);
    }
  }

  /**
   * Returns an Iterable of [index, item] for every Item of the Linked List.
   */
  public *entries(): IterableIterator<[number, T]> {
    for (let node = this._head, index = 0; node !== null; node = node.next, index += 1) {
      yield [index, node.item];
    }
  }

  /**
   * Iterates over the Items of the Linked List
   * executing the provided callback function.
   *
   * @param callback Callback function executed on each Item of the list.
   */
  public forEach(callback: (item: T, index: number) => void): void {
    for (const [index, item] of this.entries()) {
      callback(item, index);
    }
  }

  /**
   * Filters the Linked List based on the Items that pass the predicate check.
   *
   * @param predicate Predicate function used to filter the Linked List.
   * @returns Linked List with the filtered Items.
   */
  public filter(predicate: (item: T, index: number) => boolean): LinkedList<T> {
    const list = new LinkedList<T>();

    for (const [index, item] of this.entries()) {
      if (predicate(item, index)) {
        list.insertLast(item);
      }
    }

    return list;
  }

  /**
   * Maps a callback function on each Item of the Linked List
   * and returns a new Linked List based on the results.
   *
   * @param callback Callback function used to map each Item of the Linked List.
   * @returns New Linked List based on the mapped Items.
   */
  public map<U>(callback: (item: T, index: number) => U): LinkedList<U> {
    const list = new LinkedList<U>();

    for (const [index, item] of this.entries()) {
      list.insertLast(callback(item, index));
    }

    return list;
  }

  /**
   * Concatenates the provided Doubly Linked Lists
   * at the end of this Doubly Linked List.
   *
   * @param lists Doubly Linked Lists to be concatenated.
   */
  public concat(...lists: LinkedList<T>[]): void {
    if (lists.length === 0) {
      return;
    }

    if (this.isEmpty()) {
      let list: LinkedList<T>;

      do {
        list = lists.shift()!;
      } while (list.isEmpty());

      this._head = list._head;
      this._tail = list._tail;
      this._length = list._length;
    }

    for (const list of lists) {
      if (list.isEmpty()) {
        continue;
      }

      this.setPreviousNode(list._head!, this._tail);
      this.setNextNode(this._tail!, list._head);

      this._tail = list._tail;
      this._length += list._length;
    }
  }

  /**
   * Checks if every Item of the Linked List satisfy the provided predicate.
   *
   * @param predicate Predicate function used to check every Item.
   */
  public every(predicate: (item: T, index: number) => boolean): boolean {
    for (const [index, item] of this.entries()) {
      if (!predicate(item, index)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if at least one Item of the Linked List satisfies
   * the provided predicate.
   *
   * @param predicate Predicate function used to check every Item.
   */
  public some(predicate: (item: T, index: number) => boolean): boolean {
    for (const [index, item] of this.entries()) {
      if (predicate(item, index)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if the provided Item is present at the Linked List.
   *
   * @param item Item to be checked.
   */
  public includes(item: T): boolean {
    return this.find((element) => compare(element, item) === 0) !== null;
  }

  /**
   * Returns the array representation of the Linked List.
   */
  public toArray(): T[] {
    return [...this];
  }

  /**
   * Iterator for traversing the Linked List backwards.
   */
  public *reversed(): IterableIterator<T> {
    for (let node = this._tail; node !== null; node = node.previous) {
      yield node.item;
    }
  }

  /**
   * Returns the result of the Three-Way Comparison between the Linked Lists.
   *
   * @param other Linked List to be compared.
   */
  public compare(other: LinkedList<T>): number {
    if (this.isEmpty() && other.isEmpty()) {
      return 0;
    }

    if (this.isEmpty()) {
      return -1;
    }

    if (other.isEmpty()) {
      return 1;
    }

    const length = Math.min(this._length, other._length);

    for (
      let i = 0, thisNode = this._head, otherNode = other._head;
      i < length;
      i += 1, thisNode = thisNode!.next, otherNode = otherNode!.next
    ) {
      const result = compare(thisNode!.item, otherNode!.item);

      if (result !== 0) {
        return result;
      }
    }

    return 0;
  }

  /**
   * Sets the List attribute of the Linked List Node to the current Linked List.
   *
   * @param node Node to be updated.
   * @param list New Linked List of the Node.
   */
  private setList(node: LinkedListNode<T>, list: Nullable<LinkedList<T>>): void {
    if (node.list !== null) {
      node.list.deleteNode(node);
    }

    Reflect.set(node, '_list', list);
  }

  /**
   * Sets the Previous attribute of a Linked List Node.
   *
   * @param node Node to be updated.
   * @param previous Node to be set as the Previous.
   */
  private setPreviousNode(node: LinkedListNode<T>, previous: Nullable<LinkedListNode<T>>): void {
    Reflect.set(node, '_previous', previous);
  }

  /**
   * Sets the Next attribute of a Linked List Node.
   *
   * @param node Node to be updated.
   * @param next Node to be set as the Next.
   */
  private setNextNode(node: LinkedListNode<T>, next: Nullable<LinkedListNode<T>>): void {
    Reflect.set(node, '_next', next);
  }

  /**
   * Returns a new Node based on the provided Item or Node's Item.
   *
   * @param itemOrNode Element based on the Linked List's Generic,
   * or a Node's Item.
   * @returns Reference to a Linked List Node.
   */
  private createNode(itemOrNode: T | LinkedListNode<T>): LinkedListNode<T> {
    const node = itemOrNode instanceof LinkedListNode ? itemOrNode : new LinkedListNode<T>(itemOrNode);

    this.setList(node, this);

    if (itemOrNode instanceof LinkedListNode) {
      this.setNextNode(itemOrNode, null);
      this.setPreviousNode(itemOrNode, null);
    }

    return node;
  }

  /**
   * Calculates the normalized position in the Linked List
   * based on the provided index.
   *
   * If the index is positive, it is returned unmodified.
   *
   * If the index is negative, two situations can occur:
   *   * If the index is -1 and the list's length is zero, it returns 0.
   *   * Otherwise, it returns the length of the list offset by the index.
   *
   * @param index Index of the requested element.
   * @returns Normalized position based on the provided index.
   */
  private calculatePosition(index: number): number {
    return index < 0 ? (this._length === 0 && index === -1 ? 0 : this._length + index) : index;
  }

  /**
   * Splices a Node from the Linked List.
   *
   * @param node Node to be spliced from the Linked List.
   */
  private deleteNode(node: LinkedListNode<T>): void {
    // Special case: Deleting the Head.
    if (node === this._head) {
      this._head = this._head!.next;
    }

    // Special case: Deleting the Tail.
    if (node === this._tail) {
      this._tail = this._tail!.previous;
    }

    if ((node.previous?.next ?? null) !== null) {
      this.setNextNode(node.previous!, node.next);
    }

    if ((node.next?.previous ?? null) !== null) {
      this.setPreviousNode(node.next!, node.previous);
    }

    this.setPreviousNode(node, null);
    this.setNextNode(node, null);

    this._length -= 1;
  }

  /**
   * Merges two sorted Node Chains.
   *
   * @param left First Node Chain.
   * @param right Second Node Chain.
   */
  private merge(
    left: Nullable<LinkedListNode<T>>,
    right: Nullable<LinkedListNode<T>>,
    comparator: (left: T, right: T) => number
  ): [LinkedListNode<T>, LinkedListNode<T>] {
    if (left === null) {
      return [right!, right!];
    }

    if (right === null) {
      return [left!, left!];
    }

    if (comparator(left.item, right.item) >= 0) {
      const tmp = left;
      left = right;
      right = tmp;
    }

    const _head = left;
    let _tail = left;

    left = left.next;

    while (left !== null && right !== null) {
      if (comparator(left.item, right.item) >= 0) {
        const tmp: Nullable<LinkedListNode<T>> = right.next;

        this.setPreviousNode(right, left.previous);
        this.setNextNode(right, left);

        this.setNextNode(left.previous!, right);
        this.setPreviousNode(left, right);

        _tail = right!;
        right = tmp;
      } else {
        _tail = left!;
        left = left.next;
      }
    }

    if (left !== null) {
      this.setNextNode(_tail, left);
      this.setPreviousNode(left, _tail);
    } else if (right !== null) {
      this.setNextNode(_tail, right);
      this.setPreviousNode(right, _tail);
    }

    while (_tail.next !== null) {
      _tail = _tail.next;
    }

    return [_head, _tail];
  }

  /**
   * Iterator for traversing the Linked List frontwards.
   */
  public *[Symbol.iterator](): IterableIterator<T> {
    for (let node = this._head; node !== null; node = node.next) {
      yield node.item;
    }
  }

  /**
   * Representation of the Linked List.
   */
  public [util.inspect.custom](): T[] {
    return this.toArray();
  }
}
