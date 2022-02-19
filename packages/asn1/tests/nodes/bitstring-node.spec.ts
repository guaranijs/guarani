import { Class } from '../../lib/class';
import { Method } from '../../lib/method';
import { BitStringNode } from '../../lib/nodes/bitstring.node';

const variants: [number[], boolean][] = [
  [[0x03, 0x02, 0x00, 0x01], true],
  [[0x05, 0x00], false],
];

const nodes: [BitStringNode, number[]][] = [
  [new BitStringNode(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f])), [0x03, 0x06, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f]],
  [
    new BitStringNode(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]), {
      class: Class.Application,
      implicit: 0x01,
    }),
    [0x41, 0x06, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f],
  ],
  [
    new BitStringNode(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]), {
      class: Class.Application,
      explicit: 0x01,
    }),
    [0x61, 0x08, 0x03, 0x06, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f],
  ],
  [
    new BitStringNode(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]), {
      class: Class.ContextSpecific,
      implicit: 0x01,
    }),
    [0x81, 0x06, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f],
  ],
  [
    new BitStringNode(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]), {
      class: Class.ContextSpecific,
      explicit: 0x01,
    }),
    [0xa1, 0x08, 0x03, 0x06, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f],
  ],
  [
    new BitStringNode(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]), {
      class: Class.Private,
      implicit: 0x01,
    }),
    [0xc1, 0x06, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f],
  ],
  [
    new BitStringNode(Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]), {
      class: Class.Private,
      explicit: 0x01,
    }),
    [0xe1, 0x08, 0x03, 0x06, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f],
  ],
];

describe('BitString Node', () => {
  it('should fail when instantiating with a non-buffer data.', () => {
    // @ts-expect-error
    expect(() => new BitStringNode()).toThrow();

    // @ts-expect-error
    expect(() => new BitStringNode(null)).toThrow();

    // @ts-expect-error
    expect(() => new BitStringNode(true)).toThrow();

    // @ts-expect-error
    expect(() => new BitStringNode('123')).toThrow();

    // @ts-expect-error
    expect(() => new BitStringNode(123.45)).toThrow();

    // @ts-expect-error
    expect(() => new BitStringNode(123)).toThrow();

    // @ts-expect-error
    expect(() => new BitStringNode(123n)).toThrow();

    // @ts-expect-error
    expect(() => new BitStringNode({})).toThrow();

    // @ts-expect-error
    expect(() => new BitStringNode([])).toThrow();
  });

  it('should reject a Constructed Method as unsupported.', () => {
    expect(() => {
      return new BitStringNode(Buffer.from([0x01]), {
        method: Method.Constructed,
      });
    }).toThrowError('Unsupported Constructed Method for BitString.');
  });

  it('should instantiate a new BitString Node.', () => {
    expect(new BitStringNode(Buffer.from([0x00]))).toBeInstanceOf(BitStringNode);
  });

  it('should have a Buffer as its data.', () => {
    expect(new BitStringNode(Buffer.from([0x01])).value).toBeInstanceOf(Buffer);
  });

  it.each(variants)('should check whether or not a Buffer is BitString encoded.', (array, result) => {
    expect(BitStringNode.checkType(Buffer.from(array))).toBe(result);
  });

  it.each(nodes)('should encode a BitString Node.', (node, array) => {
    expect(node.encode()).toEqual(Buffer.from(array));
  });
});
