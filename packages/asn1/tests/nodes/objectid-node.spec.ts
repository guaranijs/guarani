import { Class } from '../../lib/class';
import { ObjectIdNode } from '../../lib/nodes/objectid.node';

const variants: [number[], boolean][] = [
  [[0x06, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d], true],
  [[0x26, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d], true],
  [[0x46, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d], true],
  [[0x66, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d], true],
  [[0x86, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d], true],
  [[0xa6, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d], true],
  [[0xc6, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d], true],
  [[0xe6, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d], true],
  [[0x04, 0x02, 0xfc, 0x9a], false],
];

const nodes: [ObjectIdNode, number[]][] = [
  [new ObjectIdNode('1.2.840.113549'), [0x06, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d]],
  [
    new ObjectIdNode('1.2.840.113549', {
      class: Class.Application,
      implicit: 0x01,
    }),
    [0x41, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d],
  ],
  [
    new ObjectIdNode('1.2.840.113549', {
      class: Class.Application,
      explicit: 0x01,
    }),
    [0x61, 0x08, 0x06, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d],
  ],
  [
    new ObjectIdNode('1.2.840.113549', {
      class: Class.ContextSpecific,
      implicit: 0x01,
    }),
    [0x81, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d],
  ],
  [
    new ObjectIdNode('1.2.840.113549', {
      class: Class.ContextSpecific,
      explicit: 0x01,
    }),
    [0xa1, 0x08, 0x06, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d],
  ],
  [
    new ObjectIdNode('1.2.840.113549', {
      class: Class.Private,
      implicit: 0x01,
    }),
    [0xc1, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d],
  ],
  [
    new ObjectIdNode('1.2.840.113549', {
      class: Class.Private,
      explicit: 0x01,
    }),
    [0xe1, 0x08, 0x06, 0x06, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d],
  ],
];

describe('ObjectId Node', () => {
  it('should fail when instantianing with an invalid data.', () => {
    // @ts-expect-error
    expect(() => new ObjectIdNode()).toThrow();

    // @ts-expect-error
    expect(() => new ObjectIdNode(null)).toThrow();

    // @ts-expect-error
    expect(() => new ObjectIdNode(true)).toThrow();

    // @ts-expect-error
    expect(() => new ObjectIdNode(123.45)).toThrow();

    // @ts-expect-error
    expect(() => new ObjectIdNode(123)).toThrow();

    // @ts-expect-error
    expect(() => new ObjectIdNode(123n)).toThrow();

    // @ts-expect-error
    expect(() => new ObjectIdNode({})).toThrow();

    // @ts-expect-error
    expect(() => new ObjectIdNode(Buffer.from([0x12, 0x3f]))).toThrow();

    expect(() => new ObjectIdNode('')).toThrow();

    expect(() => new ObjectIdNode('1')).toThrow();

    expect(() => new ObjectIdNode('-1.2.840.113549')).toThrow();

    expect(() => new ObjectIdNode('3.2.840.113549')).toThrow();

    expect(() => new ObjectIdNode('0.40.840.113549')).toThrow();

    expect(() => new ObjectIdNode('1.40.840.113549')).toThrow();

    expect(() => new ObjectIdNode([])).toThrow();

    expect(() => new ObjectIdNode([1])).toThrow();

    expect(() => new ObjectIdNode([-1, 2, 840, 113549])).toThrow();

    expect(() => new ObjectIdNode([3, 2, 840, 113549])).toThrow();

    expect(() => new ObjectIdNode([0, 40, 840, 113549])).toThrow();

    expect(() => new ObjectIdNode([1, 40, 840, 113549])).toThrow();

    expect(() => new ObjectIdNode([1, 2, 840, 113549.999])).toThrow();
  });

  it('should instantiate a new ObjectId Node.', () => {
    expect(new ObjectIdNode('1.2.840.113549')).toBeInstanceOf(ObjectIdNode);
    expect(new ObjectIdNode([1, 2, 840, 113549])).toBeInstanceOf(ObjectIdNode);
  });

  it('should have a number array as its data.', () => {
    const stringOid = new ObjectIdNode('1.2.840.113549');
    const arrayOid = new ObjectIdNode([1, 2, 840, 113549]);

    expect(stringOid.value).toEqual(expect.arrayContaining([1, 2, 840, 113549]));
    expect(arrayOid.value).toEqual(expect.arrayContaining([1, 2, 840, 113549]));
  });

  it.each(variants)('should check whether or not a Buffer is ObjectId encoded.', (array, result) => {
    expect(ObjectIdNode.checkType(Buffer.from(array))).toBe(result);
  });

  it.each(nodes)('should encode an ObjectId Node.', (node, array) => {
    expect(node.encode()).toEqual(Buffer.from(array));
  });
});
