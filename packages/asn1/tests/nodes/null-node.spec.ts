import { Class } from '../../lib/class';
import { NullNode } from '../../lib/nodes/null.node';

const variants: [number[], boolean][] = [
  [[0x05, 0x00], true],
  [[0x45, 0x00], true],
  [[0x85, 0x00], true],
  [[0xc5, 0x00], true],
  [[0x25, 0x00], true],
  [[0x65, 0x00], true],
  [[0xa5, 0x00], true],
  [[0xe5, 0x00], true],
  [[0x02, 0x02, 0x12, 0x5c], false],
];

const nodes: [NullNode, number[]][] = [
  [new NullNode(null), [0x05, 0x00]],
  [new NullNode(null, { class: Class.Application, implicit: 0x01 }), [0x41, 0x00]],
  [new NullNode(null, { class: Class.Application, explicit: 0x00 }), [0x60, 0x02, 0x05, 0x00]],
  [new NullNode(null, { class: Class.ContextSpecific, implicit: 0x01 }), [0x81, 0x00]],
  [new NullNode(null, { class: Class.ContextSpecific, explicit: 0x00 }), [0xa0, 0x02, 0x05, 0x00]],
  [new NullNode(null, { class: Class.Private, implicit: 0x01 }), [0xc1, 0x00]],
  [new NullNode(null, { class: Class.Private, explicit: 0x00 }), [0xe0, 0x02, 0x05, 0x00]],
];

describe('Null Node', () => {
  it('should instantiate a new Null Node.', () => {
    expect(new NullNode(null)).toBeInstanceOf(NullNode);
  });

  it('should have null as its data.', () => {
    expect(new NullNode(null).value).toBe(null);
  });

  it.each(variants)('should check whether or not a Buffer is Null encoded.', (array, result) => {
    expect(NullNode.checkType(Buffer.from(array))).toBe(result);
  });

  it.each(nodes)('should encode a Null Node.', (node, array) => {
    expect(node.encode()).toEqual(Buffer.from(array));
  });
});
