import { Class } from '../../lib/class';
import { Method } from '../../lib/method';
import { OctetStringNode } from '../../lib/nodes/octetstring.node';

const variants: [number[], boolean][] = [
  [[0x04, 0x02, 0x00, 0x01], true],
  [[0x04, 0x02, 0xf3, 0x29], true],
  [[0x04, 0x07, 0xf3, 0x29, 0x4c, 0x21, 0xc0, 0x65, 0xda], true],
  [[0x05, 0x00], false],
];

const nodes: [OctetStringNode, number[]][] = [
  [new OctetStringNode(Buffer.from([0x00, 0x01])), [0x04, 0x02, 0x00, 0x01]],
  [new OctetStringNode(Buffer.from([0x02, 0x04])), [0x04, 0x02, 0x02, 0x04]],
  [new OctetStringNode(Buffer.from([0xfe, 0x1c, 0x73])), [0x04, 0x03, 0xfe, 0x1c, 0x73]],
  [
    new OctetStringNode(Buffer.from([0x00, 0x01]), {
      class: Class.Application,
      implicit: 0x02,
    }),
    [0x42, 0x02, 0x00, 0x01],
  ],
  [
    new OctetStringNode(Buffer.from([0x02, 0x04]), {
      class: Class.Application,
      implicit: 0x02,
    }),
    [0x42, 0x02, 0x02, 0x04],
  ],
  [
    new OctetStringNode(Buffer.from([0xfe, 0x1c, 0x73]), {
      class: Class.Application,
      implicit: 0x02,
    }),
    [0x42, 0x03, 0xfe, 0x1c, 0x73],
  ],
  [
    new OctetStringNode(Buffer.from([0x00, 0x01]), {
      class: Class.Application,
      explicit: 0x02,
    }),
    [0x62, 0x04, 0x04, 0x02, 0x00, 0x01],
  ],
  [
    new OctetStringNode(Buffer.from([0x02, 0x04]), {
      class: Class.Application,
      explicit: 0x02,
    }),
    [0x62, 0x04, 0x04, 0x02, 0x02, 0x04],
  ],
  [
    new OctetStringNode(Buffer.from([0xfe, 0x1c, 0x73]), {
      class: Class.Application,
      explicit: 0x02,
    }),
    [0x62, 0x05, 0x04, 0x03, 0xfe, 0x1c, 0x73],
  ],
  [
    new OctetStringNode(Buffer.from([0x00, 0x01]), {
      class: Class.ContextSpecific,
      implicit: 0x02,
    }),
    [0x82, 0x02, 0x00, 0x01],
  ],
  [
    new OctetStringNode(Buffer.from([0x02, 0x04]), {
      class: Class.ContextSpecific,
      implicit: 0x02,
    }),
    [0x82, 0x02, 0x02, 0x04],
  ],
  [
    new OctetStringNode(Buffer.from([0xfe, 0x1c, 0x73]), {
      class: Class.ContextSpecific,
      implicit: 0x02,
    }),
    [0x82, 0x03, 0xfe, 0x1c, 0x73],
  ],
  [
    new OctetStringNode(Buffer.from([0x00, 0x01]), {
      class: Class.ContextSpecific,
      explicit: 0x02,
    }),
    [0xa2, 0x04, 0x04, 0x02, 0x00, 0x01],
  ],
  [
    new OctetStringNode(Buffer.from([0x02, 0x04]), {
      class: Class.ContextSpecific,
      explicit: 0x02,
    }),
    [0xa2, 0x04, 0x04, 0x02, 0x02, 0x04],
  ],
  [
    new OctetStringNode(Buffer.from([0xfe, 0x1c, 0x73]), {
      class: Class.ContextSpecific,
      explicit: 0x02,
    }),
    [0xa2, 0x05, 0x04, 0x03, 0xfe, 0x1c, 0x73],
  ],
  [
    new OctetStringNode(Buffer.from([0x00, 0x01]), {
      class: Class.Private,
      implicit: 0x02,
    }),
    [0xc2, 0x02, 0x00, 0x01],
  ],
  [
    new OctetStringNode(Buffer.from([0x02, 0x04]), {
      class: Class.Private,
      implicit: 0x02,
    }),
    [0xc2, 0x02, 0x02, 0x04],
  ],
  [
    new OctetStringNode(Buffer.from([0xfe, 0x1c, 0x73]), {
      class: Class.Private,
      implicit: 0x02,
    }),
    [0xc2, 0x03, 0xfe, 0x1c, 0x73],
  ],
  [
    new OctetStringNode(Buffer.from([0x00, 0x01]), {
      class: Class.Private,
      explicit: 0x02,
    }),
    [0xe2, 0x04, 0x04, 0x02, 0x00, 0x01],
  ],
  [
    new OctetStringNode(Buffer.from([0x02, 0x04]), {
      class: Class.Private,
      explicit: 0x02,
    }),
    [0xe2, 0x04, 0x04, 0x02, 0x02, 0x04],
  ],
  [
    new OctetStringNode(Buffer.from([0xfe, 0x1c, 0x73]), {
      class: Class.Private,
      explicit: 0x02,
    }),
    [0xe2, 0x05, 0x04, 0x03, 0xfe, 0x1c, 0x73],
  ],
];

describe('OctetString Node', () => {
  it('should fail when instantiating with a non-buffer data.', () => {
    // @ts-expect-error
    expect(() => new OctetStringNode()).toThrow();

    // @ts-expect-error
    expect(() => new OctetStringNode(null)).toThrow();

    // @ts-expect-error
    expect(() => new OctetStringNode(true)).toThrow();

    // @ts-expect-error
    expect(() => new OctetStringNode('123')).toThrow();

    // @ts-expect-error
    expect(() => new OctetStringNode(123.45)).toThrow();

    // @ts-expect-error
    expect(() => new OctetStringNode(123)).toThrow();

    // @ts-expect-error
    expect(() => new OctetStringNode(123n)).toThrow();

    // @ts-expect-error
    expect(() => new OctetStringNode({})).toThrow();

    // @ts-expect-error
    expect(() => new OctetStringNode([])).toThrow();
  });

  it('should reject a Constructed Method as unsupported.', () => {
    expect(() => {
      return new OctetStringNode(Buffer.from([0x01]), {
        method: Method.Constructed,
      });
    }).toThrowError('Unsupported Constructed Method for OctetString.');
  });

  it('should instantiate a new OctetString Node.', () => {
    expect(new OctetStringNode(Buffer.from([0x00]))).toBeInstanceOf(OctetStringNode);
  });

  it('should have a Buffer as its data.', () => {
    expect(new OctetStringNode(Buffer.from([0x01])).value).toBeInstanceOf(Buffer);
  });

  it.each(variants)('should check whether or not a Buffer is OctetString encoded.', (array, result) => {
    expect(OctetStringNode.checkType(Buffer.from(array))).toBe(result);
  });

  it.each(nodes)('should encode an OctetString Node.', (node, array) => {
    expect(node.encode()).toEqual(Buffer.from(array));
  });
});
