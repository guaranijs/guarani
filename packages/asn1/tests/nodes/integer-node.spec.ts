import { Class } from '../../lib/class';
import { IntegerNode } from '../../lib/nodes/integer.node';

const variants: [number[], boolean][] = [
  [[0x02, 0x03, 0x01, 0x00, 0x01], true],
  [[0x02, 0x03, 0xfe, 0xff, 0xff], true],
  [[0x22, 0x03, 0x01, 0x00, 0x01], true],
  [[0x22, 0x03, 0xfe, 0xff, 0xff], true],
  [[0x42, 0x03, 0x01, 0x00, 0x01], true],
  [[0x42, 0x03, 0xfe, 0xff, 0xff], true],
  [[0x62, 0x03, 0x01, 0x00, 0x01], true],
  [[0x62, 0x03, 0xfe, 0xff, 0xff], true],
  [[0x82, 0x03, 0x01, 0x00, 0x01], true],
  [[0x82, 0x03, 0xfe, 0xff, 0xff], true],
  [[0xa2, 0x03, 0x01, 0x00, 0x01], true],
  [[0xa2, 0x03, 0xfe, 0xff, 0xff], true],
  [[0xc2, 0x03, 0x01, 0x00, 0x01], true],
  [[0xc2, 0x03, 0xfe, 0xff, 0xff], true],
  [[0xe2, 0x03, 0x01, 0x00, 0x01], true],
  [[0xe2, 0x03, 0xfe, 0xff, 0xff], true],
  [[0x01, 0x01, 0x01], false],
];

const nodes: [IntegerNode, number[]][] = [
  [new IntegerNode(65537), [0x02, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(65537n), [0x02, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(-65537), [0x02, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(-65537n), [0x02, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(65537, { class: Class.Application, implicit: 0x00 }), [0x40, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(65537n, { class: Class.Application, implicit: 0x00 }), [0x40, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(-65537, { class: Class.Application, implicit: 0x00 }), [0x40, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(-65537n, { class: Class.Application, implicit: 0x00 }), [0x40, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(65537, { class: Class.Application, explicit: 0x00 }), [0x60, 0x05, 0x02, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(65537n, { class: Class.Application, explicit: 0x00 }), [0x60, 0x05, 0x02, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(-65537, { class: Class.Application, explicit: 0x00 }), [0x60, 0x05, 0x02, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(-65537n, { class: Class.Application, explicit: 0x00 }), [0x60, 0x05, 0x02, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(65537, { class: Class.ContextSpecific, implicit: 0x00 }), [0x80, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(65537n, { class: Class.ContextSpecific, implicit: 0x00 }), [0x80, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(-65537, { class: Class.ContextSpecific, implicit: 0x00 }), [0x80, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(-65537n, { class: Class.ContextSpecific, implicit: 0x00 }), [0x80, 0x03, 0xfe, 0xff, 0xff]],
  [
    new IntegerNode(65537, { class: Class.ContextSpecific, explicit: 0x00 }),
    [0xa0, 0x05, 0x02, 0x03, 0x01, 0x00, 0x01],
  ],
  [
    new IntegerNode(65537n, { class: Class.ContextSpecific, explicit: 0x00 }),
    [0xa0, 0x05, 0x02, 0x03, 0x01, 0x00, 0x01],
  ],
  [
    new IntegerNode(-65537, { class: Class.ContextSpecific, explicit: 0x00 }),
    [0xa0, 0x05, 0x02, 0x03, 0xfe, 0xff, 0xff],
  ],
  [
    new IntegerNode(-65537n, { class: Class.ContextSpecific, explicit: 0x00 }),
    [0xa0, 0x05, 0x02, 0x03, 0xfe, 0xff, 0xff],
  ],
  [new IntegerNode(65537, { class: Class.Private, implicit: 0x00 }), [0xc0, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(65537n, { class: Class.Private, implicit: 0x00 }), [0xc0, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(-65537, { class: Class.Private, implicit: 0x00 }), [0xc0, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(-65537n, { class: Class.Private, implicit: 0x00 }), [0xc0, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(65537, { class: Class.Private, explicit: 0x00 }), [0xe0, 0x05, 0x02, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(65537n, { class: Class.Private, explicit: 0x00 }), [0xe0, 0x05, 0x02, 0x03, 0x01, 0x00, 0x01]],
  [new IntegerNode(-65537, { class: Class.Private, explicit: 0x00 }), [0xe0, 0x05, 0x02, 0x03, 0xfe, 0xff, 0xff]],
  [new IntegerNode(-65537n, { class: Class.Private, explicit: 0x00 }), [0xe0, 0x05, 0x02, 0x03, 0xfe, 0xff, 0xff]],
];

describe('Integer Node', () => {
  it('should fail when instantiating with a non-integer data.', () => {
    // @ts-expect-error
    expect(() => new IntegerNode()).toThrow();

    // @ts-expect-error
    expect(() => new IntegerNode(null)).toThrow();

    // @ts-expect-error
    expect(() => new IntegerNode(true)).toThrow();

    // @ts-expect-error
    expect(() => new IntegerNode('123')).toThrow();

    // @ts-expect-error
    expect(() => new IntegerNode(Buffer.from([0x01, 0x02, 0x03]))).toThrow();

    // @ts-expect-error
    expect(() => new IntegerNode({})).toThrow();

    // @ts-expect-error
    expect(() => new IntegerNode([])).toThrow();

    expect(() => new IntegerNode(123.45)).toThrow();
  });

  it('should instantiate a new Integer Node.', () => {
    expect(new IntegerNode(123)).toBeInstanceOf(IntegerNode);
    expect(new IntegerNode(-123)).toBeInstanceOf(IntegerNode);
    expect(new IntegerNode(123n)).toBeInstanceOf(IntegerNode);
    expect(new IntegerNode(-123n)).toBeInstanceOf(IntegerNode);
  });

  it('should have a bigint as its data.', () => {
    expect(new IntegerNode(123).value).toBe(123n);
    expect(new IntegerNode(-123).value).toBe(-123n);
    expect(new IntegerNode(123n).value).toBe(123n);
    expect(new IntegerNode(-123n).value).toBe(-123n);
  });

  it.each(variants)('should check whether or not a Buffer is Integer encoded.', (array, result) => {
    expect(IntegerNode.checkType(Buffer.from(array))).toBe(result);
  });

  it.each(nodes)('should encode an Integer Node.', (node, array) => {
    expect(node.encode()).toEqual(Buffer.from(array));
  });
});
