import { Class } from '../../lib/class';
import { BooleanNode } from '../../lib/nodes/boolean.node';

const variants: [number[], boolean][] = [
  [[0x01, 0x01, 0x00], true],
  [[0x01, 0x01, 0x01], true],
  [[0x02, 0x02, 0x1a, 0x5c], false],
];

const nodes: [BooleanNode, number[]][] = [
  [new BooleanNode(true), [0x01, 0x01, 0x01]],
  [new BooleanNode(false), [0x01, 0x01, 0x00]],
  [new BooleanNode(true, { class: Class.Application, implicit: 0x02 }), [0x42, 0x01, 0x01]],
  [new BooleanNode(false, { class: Class.Application, implicit: 0x02 }), [0x42, 0x01, 0x00]],
  [new BooleanNode(true, { class: Class.Application, explicit: 0x02 }), [0x62, 0x03, 0x01, 0x01, 0x01]],
  [new BooleanNode(false, { class: Class.Application, explicit: 0x02 }), [0x62, 0x03, 0x01, 0x01, 0x00]],
  [new BooleanNode(true, { class: Class.ContextSpecific, implicit: 0x02 }), [0x82, 0x01, 0x01]],
  [new BooleanNode(false, { class: Class.ContextSpecific, implicit: 0x02 }), [0x82, 0x01, 0x00]],
  [new BooleanNode(true, { class: Class.ContextSpecific, explicit: 0x02 }), [0xa2, 0x03, 0x01, 0x01, 0x01]],
  [new BooleanNode(false, { class: Class.ContextSpecific, explicit: 0x02 }), [0xa2, 0x03, 0x01, 0x01, 0x00]],
  [new BooleanNode(true, { class: Class.Private, implicit: 0x02 }), [0xc2, 0x01, 0x01]],
  [new BooleanNode(false, { class: Class.Private, implicit: 0x02 }), [0xc2, 0x01, 0x00]],
  [new BooleanNode(true, { class: Class.Private, explicit: 0x02 }), [0xe2, 0x03, 0x01, 0x01, 0x01]],
  [new BooleanNode(false, { class: Class.Private, explicit: 0x02 }), [0xe2, 0x03, 0x01, 0x01, 0x00]],
];

describe('Boolean Node', () => {
  it('should fail when instantiating with a non-boolean data.', () => {
    // @ts-expect-error
    expect(() => new BooleanNode(123)).toThrow();
  });

  it('should instantiate a new Boolean Node.', () => {
    expect(new BooleanNode(true)).toBeInstanceOf(BooleanNode);
    expect(new BooleanNode(false)).toBeInstanceOf(BooleanNode);
  });

  it('should have a boolean as its data.', () => {
    expect(new BooleanNode(true).value).toBe(true);
    expect(new BooleanNode(false).value).toBe(false);
  });

  it.each(variants)('should check whether or not a Buffer is Boolean encoded.', (array, result) => {
    expect(BooleanNode.checkType(Buffer.from(array))).toBe(result);
  });

  it.each(nodes)('should encode a Boolean Node.', (node, array) => {
    expect(node.encode()).toEqual(Buffer.from(array));
  });
});
