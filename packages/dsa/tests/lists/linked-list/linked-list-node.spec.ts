import { LinkedListNode } from '../../../lib/lists/linked-list/linked-list-node';

describe('Linked List Node', () => {
  it('should create a new Linked List Node.', () => {
    const node = new LinkedListNode<number>(123);

    expect(node.item).toBe(123);
    expect(node.list).toBeNull();
    expect(node.next).toBeNull();
    expect(node.previous).toBeNull();
  });
});
