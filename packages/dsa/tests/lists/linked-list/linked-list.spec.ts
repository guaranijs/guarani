import { compare } from '@guarani/objects';

import { LinkedList } from '../../../lib/lists/linked-list/linked-list';
import { LinkedListNode } from '../../../lib/lists/linked-list/linked-list-node';

describe('Linked List constructor()', () => {
  it('should create an empty list.', () => {
    const list = new LinkedList();

    expect(list.length).toBe(0);

    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();

    expect(list.isEmpty()).toBe(true);
  });

  it('should create a list with three elements.', () => {
    const list = new LinkedList<string>(['foo', 'bar', 'baz']);

    expect(list.length).toBe(3);

    expect(list.head?.item).toBe('foo');
    expect(list.tail?.item).toBe('baz');

    expect(list.toArray()).toEqual(['foo', 'bar', 'baz']);

    expect(list.isEmpty()).toBe(false);
  });
});

describe('Linked List insertFirst()', () => {
  it('should insert a new element at the head of an empty list.', () => {
    const list = new LinkedList<number>();

    expect(list.insertFirst(9)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(1);

    expect(list.head?.item).toBe(9);
    expect(list.tail?.item).toBe(9);

    expect(list.toArray()).toEqual([9]);
  });

  it('should insert a new element at the head of a list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const oldHead = list.head!;

    expect(list.insertFirst(9)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(list.head?.item).toBe(9);
    expect(list.head?.next).toBe(oldHead);

    expect(list.toArray()).toEqual([9, 1, 2, 3]);

    expect(oldHead.previous).toBe(list.head);
  });

  it('should insert the element of a node at the head of an empty list.', () => {
    const list = new LinkedList<number>();

    expect(list.insertFirst(new LinkedListNode(9))).toBeUndefined();

    expect(list.length).toBe(1);

    expect(list.head?.item).toBe(9);
    expect(list.tail?.item).toBe(9);

    expect(list.toArray()).toEqual([9]);

    expect(list.head?.list).toBe(list);
  });

  it('should insert the element of a node at the head of a list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const oldHead = list.head!;

    expect(list.insertFirst(new LinkedListNode(9))).toBeUndefined();

    expect(list.length).toBe(4);

    expect(list.head?.item).toBe(9);
    expect(list.head?.list).toBe(list);
    expect(list.head?.next).toBe(oldHead);

    expect(list.toArray()).toEqual([9, 1, 2, 3]);

    expect(oldHead.previous).toBe(list.head);
  });
});

describe('Linked List insertLast()', () => {
  it('should insert a new element at the tail of an empty list.', () => {
    const list = new LinkedList<number>();

    expect(list.insertLast(9)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(1);

    expect(list.tail?.item).toBe(9);
    expect(list.head?.item).toBe(9);

    expect(list.toArray()).toEqual([9]);
  });

  it('should insert a new element at the tail of a list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const oldTail = list.tail!;

    expect(list.insertLast(9)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(list.tail?.item).toBe(9);
    expect(list.tail?.previous).toBe(oldTail);

    expect(list.toArray()).toEqual([1, 2, 3, 9]);

    expect(oldTail.next).toBe(list.tail);
  });

  it('should insert the element of a node at the tail of an empty list.', () => {
    const list = new LinkedList<number>();

    expect(list.insertLast(new LinkedListNode(9))).toBeUndefined();

    expect(list.length).toBe(1);

    expect(list.tail?.item).toBe(9);
    expect(list.head?.item).toBe(9);

    expect(list.toArray()).toEqual([9]);

    expect(list.tail?.list).toBe(list);
  });

  it('should insert the element of a node at the tail of a list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const oldTail = list.tail!;

    expect(list.insertLast(new LinkedListNode(9))).toBeUndefined();

    expect(list.length).toBe(4);

    expect(list.tail?.item).toBe(9);
    expect(list.tail?.list).toBe(list);
    expect(list.tail?.previous).toBe(oldTail);

    expect(list.toArray()).toEqual([1, 2, 3, 9]);

    expect(oldTail.next).toBe(list.tail);
  });
});

describe('Linked List insertBefore()', () => {
  it('should fail if the pivot is not a member of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(() => list.insertBefore(9, new LinkedListNode(1))).toThrow();
  });

  it('should insert a new element before the head of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const oldHead = list.head!;

    expect(list.insertBefore(9, list.head!)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(list.head?.item).toBe(9);
    expect(list.head?.next).toBe(oldHead);

    expect(list.toArray()).toEqual([9, 1, 2, 3]);

    expect(oldHead.previous).toBe(list.head);
  });

  it('should insert a new element at the middle of the list.', () => {
    const list = new LinkedList<number>();

    list.insertLast(1);
    const pivot = list.insertLast(2);
    list.insertLast(3);

    const node = list.insertBefore(9, pivot);

    expect(node).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(node.next).toBe(pivot);
    expect(pivot.previous).toBe(node);

    expect(list.toArray()).toEqual([1, 9, 2, 3]);
  });

  it('should insert a new element before the tail of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    const node = list.insertBefore(9, list.tail!);

    expect(node).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(node.item).toBe(9);
    expect(node.next).toBe(list.tail);

    expect(list.tail?.previous).toBe(node);

    expect(list.toArray()).toEqual([1, 2, 9, 3]);
  });

  it('should insert the element of a node before the head of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const oldHead = list.head!;

    expect(list.insertBefore(new LinkedListNode(9), list.head!)).toBeUndefined();

    expect(list.length).toBe(4);

    expect(list.head?.item).toBe(9);
    expect(list.head?.next).toBe(oldHead);

    expect(list.toArray()).toEqual([9, 1, 2, 3]);

    expect(oldHead.previous).toBe(list.head);
  });

  it('should insert the element of a node at the middle of the list.', () => {
    const list = new LinkedList<number>();
    const node = new LinkedListNode(9);

    list.insertLast(1);
    const pivot = list.insertLast(2);
    list.insertLast(3);

    list.insertBefore(node, pivot);

    expect(node).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(node.next).toBe(pivot);
    expect(pivot.previous).toBe(node);

    expect(list.toArray()).toEqual([1, 9, 2, 3]);
  });

  it('should insert the element of a node before the tail of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const node = new LinkedListNode(9);

    list.insertBefore(node, list.tail!);

    expect(node).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(node.item).toBe(9);
    expect(node.next).toBe(list.tail);

    expect(list.tail?.previous).toBe(node);

    expect(list.toArray()).toEqual([1, 2, 9, 3]);
  });
});

describe('Linked List insertAfter()', () => {
  it('should fail if the pivot is not a member of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(() => list.insertAfter(9, new LinkedListNode(3))).toThrow();
  });

  it('should insert a new element after the head of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    const node = list.insertAfter(9, list.head!);

    expect(node).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(node.item).toBe(9);
    expect(node.previous).toBe(list.head);

    expect(list.head?.next).toBe(node);

    expect(list.toArray()).toEqual([1, 9, 2, 3]);
  });

  it('should insert a new element at the middle of the list.', () => {
    const list = new LinkedList<number>();

    list.insertLast(1);
    const pivot = list.insertLast(2);
    list.insertLast(3);

    const node = list.insertAfter(9, pivot);

    expect(node).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(node.previous).toBe(pivot);
    expect(pivot.next).toBe(node);

    expect(list.toArray()).toEqual([1, 2, 9, 3]);
  });

  it('should insert a new element after the tail of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const oldTail = list.tail!;

    expect(list.insertAfter(9, list.tail!)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(list.tail?.item).toBe(9);
    expect(list.tail?.previous).toBe(oldTail);

    expect(list.toArray()).toEqual([1, 2, 3, 9]);

    expect(oldTail.next).toBe(list.tail);
  });

  it('should insert the element of a node after the head of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const node = new LinkedListNode(9);

    list.insertAfter(node, list.head!);

    expect(node).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(node.item).toBe(9);
    expect(node.previous).toBe(list.head);

    expect(list.head?.next).toBe(node);

    expect(list.toArray()).toEqual([1, 9, 2, 3]);
  });

  it('should insert the element of a node at the middle of the list.', () => {
    const list = new LinkedList<number>();
    const node = new LinkedListNode(9);

    list.insertLast(1);
    const pivot = list.insertLast(2);
    list.insertLast(3);

    list.insertAfter(node, pivot);

    expect(node).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);

    expect(node.previous).toBe(pivot);
    expect(pivot.next).toBe(node);

    expect(list.toArray()).toEqual([1, 2, 9, 3]);
  });

  it('should insert the element of a node after the tail of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);
    const oldTail = list.tail!;

    expect(list.insertAfter(new LinkedListNode(9), list.tail!)).toBeUndefined();

    expect(list.length).toBe(4);

    expect(list.tail?.item).toBe(9);
    expect(list.tail?.previous).toBe(oldTail);

    expect(list.toArray()).toEqual([1, 2, 3, 9]);

    expect(oldTail.next).toBe(list.tail);
  });
});

describe('Linked List insertAt()', () => {
  it('should fail when providing an invalid index.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(() => list.insertAt(8, 7)).toThrow();
    expect(() => list.insertAt(8, -7)).toThrow();
  });

  it('should insert a new element at the head of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.insertAt(8, 0)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);
    expect(list.toArray()).toEqual([8, 1, 2, 3]);

    expect(list.insertAt(9, -4)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(5);
    expect(list.toArray()).toEqual([9, 8, 1, 2, 3]);
  });

  it('should insert a new element at the tail of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.insertAt(8, 3)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(4);
    expect(list.toArray()).toEqual([1, 2, 3, 8]);

    expect(list.insertAt(9, -1)).toBeInstanceOf(LinkedListNode);

    expect(list.length).toBe(5);
    expect(list.toArray()).toEqual([1, 2, 3, 9, 8]);
  });

  it('should insert the element of a node at the head of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.insertAt(new LinkedListNode(8), 0)).toBeUndefined();

    expect(list.length).toBe(4);
    expect(list.toArray()).toEqual([8, 1, 2, 3]);

    expect(list.insertAt(new LinkedListNode(9), -4)).toBeUndefined();

    expect(list.length).toBe(5);
    expect(list.toArray()).toEqual([9, 8, 1, 2, 3]);
  });

  it('should insert the element of a node at the tail of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.insertAt(new LinkedListNode(8), 3)).toBeUndefined();

    expect(list.length).toBe(4);
    expect(list.toArray()).toEqual([1, 2, 3, 8]);

    expect(list.insertAt(new LinkedListNode(9), -1)).toBeUndefined();

    expect(list.length).toBe(5);
    expect(list.toArray()).toEqual([1, 2, 3, 9, 8]);
  });
});

describe('Linked List find()', () => {
  it('should return null when an item is not on the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.find((item) => item === 4)).toBeNull();
  });

  it('should find the first occurrence of an item.', () => {
    const list = new LinkedList<any>([
      { id: 1, name: 'foo' },
      { id: 2, name: 'bar' },
      { id: 3, name: 'foo' },
    ]);

    expect(list.find((item) => item.name === 'foo')!.item).toMatchObject({
      id: 1,
      name: 'foo',
    });
  });
});

describe('Linked List findLast()', () => {
  it('should return null when an item is not on the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.findLast((item) => item === 4)).toBeNull();
  });

  it('should find the first occurrence of an item.', () => {
    const list = new LinkedList<any>([
      { id: 1, name: 'foo' },
      { id: 2, name: 'bar' },
      { id: 3, name: 'foo' },
    ]);

    expect(list.findLast((item) => item.name === 'foo')!.item).toMatchObject({
      id: 3,
      name: 'foo',
    });
  });
});

describe('Linked List get()', () => {
  it('should fail when the list is empty.', () => {
    expect(() => new LinkedList().get(0)).toThrow();
  });

  it('should fail when providing an invalid index.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(() => list.get(7)).toThrow();
    expect(() => list.get(-7)).toThrow();
  });

  it('should return the item at the requested positive index.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4, 5]);

    for (let i = 0; i < list.length; i++) {
      expect(list.get(i).item).toBe(i + 1);
    }
  });

  it('should return the item at the requested negative index.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4, 5]);

    for (let i = 1; i <= list.length; i++) {
      expect(list.get(-i).item).toBe(list.length - i + 1);
    }
  });
});

describe('Linked List indexOf()', () => {
  it('should return null when the list is empty.', () => {
    expect(new LinkedList().indexOf(123)).toBeNull();
  });

  it('should return null when the item is not a member of the list.', () => {
    expect(new LinkedList([1, 2, 3]).indexOf(4)).toBeNull();
  });

  it('should fail when the provided node is not a member of the list.', () => {
    expect(() => new LinkedList([1, 2, 3]).indexOf(new LinkedListNode(3))).toThrow();
  });

  it('should return the index of the requested item.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.indexOf(1)).toBe(0);
    expect(list.indexOf(2)).toBe(1);
    expect(list.indexOf(3)).toBe(2);
  });

  it('should return the index of the requested node.', () => {
    const list = new LinkedList<number>();

    list.insertLast(1);
    const node = list.insertLast(2);
    list.insertLast(3);

    expect(list.indexOf(list.head!)).toBe(0);
    expect(list.indexOf(node)).toBe(1);
    expect(list.indexOf(list.tail!)).toBe(2);
  });
});

describe('Linked List update()', () => {
  it('should fail when the provided node is not a member of the list.', () => {
    expect(() => new LinkedList([1, 2, 3]).update(new LinkedListNode(2), 9)).toThrow();
  });

  it('should return false when the item is not a member of the list.', () => {
    expect(new LinkedList([1, 2, 3]).update(4, 9)).toBe(false);
  });

  it('should update an item with a new value.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4]);

    expect(list.update(2, 9)).toBe(true);
    expect(list.toArray()).toEqual([1, 9, 3, 4]);
  });

  it('should update an item with a new node.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4]);
    const node = new LinkedListNode<number>(9);

    expect(list.update(2, node)).toBe(true);
    expect(list.toArray()).toEqual([1, 9, 3, 4]);

    expect(node.list).toBe(list);
  });

  it('should update a node with a new value.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4]);

    expect(list.update(list.head!, 9)).toBe(true);
    expect(list.toArray()).toEqual([9, 2, 3, 4]);
  });

  it('should update a node with a new node.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4]);
    const node = new LinkedListNode<number>(9);

    expect(list.update(list.head!, node)).toBe(true);
    expect(list.toArray()).toEqual([9, 2, 3, 4]);

    expect(list.head).toBe(node);
    expect(node.list).toBe(list);
  });
});

describe('Linked List updateAt()', () => {
  it('should fail when the list is empty.', () => {
    expect(() => new LinkedList().updateAt(0, 9)).toThrow();
  });

  it('should fail when providing an invalid index.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(() => list.updateAt(7, 9)).toThrow();
    expect(() => list.updateAt(-7, 9)).toThrow();
  });

  it('should update the item at the provided positive index.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4, 5]);

    expect(() => list.updateAt(0, 6)).not.toThrow();
    expect(() => list.updateAt(2, 7)).not.toThrow();
    expect(() => list.updateAt(4, 8)).not.toThrow();

    expect(list.toArray()).toEqual([6, 2, 7, 4, 8]);
  });

  it('should update the item at the provided negative index.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4, 5]);

    expect(() => list.updateAt(-5, 6)).not.toThrow();
    expect(() => list.updateAt(-3, 7)).not.toThrow();
    expect(() => list.updateAt(-1, 8)).not.toThrow();

    expect(list.toArray()).toEqual([6, 2, 7, 4, 8]);
  });

  it('should update the node at the provided positive index.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4, 5]);

    const node1 = new LinkedListNode<number>(6);
    const node2 = new LinkedListNode<number>(7);
    const node3 = new LinkedListNode<number>(8);

    expect(() => list.updateAt(0, node1)).not.toThrow();
    expect(() => list.updateAt(2, node2)).not.toThrow();
    expect(() => list.updateAt(4, node3)).not.toThrow();

    expect(list.toArray()).toEqual([6, 2, 7, 4, 8]);
  });

  it('should update the node at the provided negative index.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4, 5]);

    const node1 = new LinkedListNode<number>(6);
    const node2 = new LinkedListNode<number>(7);
    const node3 = new LinkedListNode<number>(8);

    expect(() => list.updateAt(-5, node1)).not.toThrow();
    expect(() => list.updateAt(-3, node2)).not.toThrow();
    expect(() => list.updateAt(-1, node3)).not.toThrow();

    expect(list.toArray()).toEqual([6, 2, 7, 4, 8]);
  });
});

describe('Linked List deleteFirst()', () => {
  it('should delete the head of the list.', () => {
    const list = new LinkedList<string>(['foo', 'bar', 'baz']);

    expect(() => list.deleteFirst()).not.toThrow();

    expect(list.length).toBe(2);
    expect(list.toArray()).toEqual(['bar', 'baz']);
  });
});

describe('Linked List deleteLast()', () => {
  it('should delete the tail of the list.', () => {
    const list = new LinkedList<string>(['foo', 'bar', 'baz']);

    expect(() => list.deleteLast()).not.toThrow();

    expect(list.length).toBe(2);
    expect(list.toArray()).toEqual(['foo', 'bar']);
  });
});

describe('Linked List delete()', () => {
  it('should gracefully return when the list is empty.', () => {
    expect(new LinkedList().delete(3)).toBe(false);
    expect(new LinkedList().delete(new LinkedListNode(3))).toBeUndefined();
  });

  it('should fail when the provided node is not a member of the list.', () => {
    const list = new LinkedList([1, 2, 3]);

    expect(() => list.delete(new LinkedListNode(1))).toThrow();
  });

  it('should return false when the item is not a member of the list.', () => {
    const list = new LinkedList([1, 2, 3]);

    expect(list.delete(4)).toBe(false);
  });

  it('should delete the provided item from the list.', () => {
    const list1 = new LinkedList([1, 2, 3, 4, 5]);
    const list2 = new LinkedList([1, 2, 3, 4, 5]);
    const list3 = new LinkedList([1, 2, 3, 4, 5]);
    const list4 = new LinkedList([1, 2, 3, 4, 5]);
    const list5 = new LinkedList([1, 2, 3, 4, 5]);

    expect(list1.delete(1)).toBe(true);
    expect(list1.length).toBe(4);

    expect(list2.delete(2)).toBe(true);
    expect(list2.length).toBe(4);

    expect(list3.delete(3)).toBe(true);
    expect(list3.length).toBe(4);

    expect(list4.delete(4)).toBe(true);
    expect(list4.length).toBe(4);

    expect(list5.delete(5)).toBe(true);
    expect(list5.length).toBe(4);
  });

  it('should delete the provided node from the list.', () => {
    const list = new LinkedList<number>();

    list.insertLast(1);
    list.insertLast(2);
    const node = list.insertLast(3);
    list.insertLast(4);
    list.insertLast(5);

    expect(() => list.delete(list.head!)).not.toThrow();
    expect(list.length).toBe(4);

    expect(() => list.delete(list.tail!)).not.toThrow();
    expect(list.length).toBe(3);

    expect(() => list.delete(node)).not.toThrow();
    expect(list.length).toBe(2);
  });
});

describe('Linked List deleteAt()', () => {
  it('should fail when providing an invalid index.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(() => list.deleteAt(7)).toThrow();
    expect(() => list.deleteAt(-7)).toThrow();
  });

  it('should delete the item at the provided index of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3, 4, 5]);

    expect(() => list.deleteAt(0)).not.toThrow();
    expect(list.toArray()).toEqual([2, 3, 4, 5]);

    expect(() => list.deleteAt(3)).not.toThrow();
    expect(list.toArray()).toEqual([2, 3, 4]);

    expect(() => list.deleteAt(1)).not.toThrow();
    expect(list.toArray()).toEqual([2, 4]);
  });
});

describe('Linked List clear()', () => {
  it('should clear the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.length).toBe(3);

    expect(() => list.clear()).not.toThrow();

    expect(list.length).toBe(0);

    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
  });
});

describe('Linked List reverse()', () => {
  it('should reverse the contents of the list in-place.', () => {
    const list = new LinkedList<number>([6, 4, 2, 1, 3, 8, 7, 0, 9, 5]);

    expect(() => list.reverse()).not.toThrow();

    expect(list.toArray()).toEqual([5, 9, 0, 7, 8, 3, 1, 2, 4, 6]);

    expect(list.head!.item).toBe(5);
    expect(list.tail!.item).toBe(6);
  });
});

describe('Linked List sort()', () => {
  it('should sort the list in ascending order.', () => {
    const list = new LinkedList<number>([6, 4, 2, 1, 3, 8, 7, 0, 9, 5]);

    expect(() => list.sort()).not.toThrow();

    expect(list.toArray()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    expect(list.head!.item).toBe(0);
    expect(list.tail!.item).toBe(9);
  });

  it('should sort the list in descending order.', () => {
    const list = new LinkedList<number>([6, 4, 2, 1, 3, 8, 7, 0, 9, 5]);
    const comparator = (left: number, right: number): number => {
      return -1 * compare(left, right);
    };

    expect(() => list.sort(comparator)).not.toThrow();

    expect(list.toArray()).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);

    expect(list.head!.item).toBe(9);
    expect(list.tail!.item).toBe(0);
  });
});

describe('Linked List entries()', () => {
  it('should yield tuples of [index, item].', () => {
    const list = new LinkedList<string>(['1', '2', '3', '4', '5']);

    for (const [index, item] of list.entries()) {
      expect(item).toEqual(String(index + 1));
    }
  });
});

describe('Linked List filter()', () => {
  it('should return a new list with the filtered elements.', () => {
    const list = new LinkedList<number>([6, 4, 2, 1, 3, 8, 7, 0, 9, 5]);
    const evens = list.filter((item) => item % 2 === 0);

    expect(evens.length).toBe(5);
    expect(evens.toArray()).toEqual([6, 4, 2, 8, 0]);
  });
});

describe('Linked List map()', () => {
  it('should map a callback on each element and return the resulting list.', () => {
    const list = new LinkedList<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const squares = list.map((item) => item ** 2);

    expect(squares.length).toBe(11);
    expect(squares.toArray()).toEqual([0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100]);
  });
});

describe('Linked List concat()', () => {
  it('should concatenate the provided lists.', () => {
    const list = new LinkedList<number>();

    const a = new LinkedList<number>([1, 2, 3]);
    const b = new LinkedList<number>([4, 5, 6]);
    const c = new LinkedList<number>([7, 8, 9]);

    expect(() => list.concat(a, b, c)).not.toThrow();

    expect(list.length).toBe(9);
    expect(list.toArray()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    expect(list.head!.item).toBe(1);
    expect(list.tail!.item).toBe(9);
  });

  it('should concatenate the provided lists.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    const a = new LinkedList<number>([4, 5, 6]);
    const b = new LinkedList<number>([7, 8, 9]);
    const c = new LinkedList<number>([10, 11, 12]);

    expect(() => list.concat(a, b, c)).not.toThrow();

    expect(list.length).toBe(12);
    expect(list.toArray()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    expect(list.head!.item).toBe(1);
    expect(list.tail!.item).toBe(12);
  });
});

describe('Linked List includes()', () => {
  it('should return false when the item is not a member of the list.', () => {
    expect(new LinkedList([1, 2, 3]).includes(4)).toBe(false);
  });

  it('should return true when the item is a member of the list.', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.includes(1)).toBe(true);
    expect(list.includes(2)).toBe(true);
    expect(list.includes(3)).toBe(true);
  });
});
