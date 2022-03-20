import { Class } from '../../lib/class';
import { Encoding } from '../../lib/encoding';
import { BitStringNode } from '../../lib/nodes/bitstring.node';

const failures: any[] = [
  undefined,
  null,
  true,
  123,
  123.45,
  123n,
  'foo',
  {},
  [123],
  [new BitStringNode('11'), new BitStringNode('10011011')],
];

const instances: [BitStringNode, object][] = [
  [
    new BitStringNode('0110111001011101'),
    { data: '0110111001011101', encoding: Encoding.Primitive, class: Class.Universal, padding: '' },
  ],
  [
    new BitStringNode('011011100101110111'),
    { data: '011011100101110111', encoding: Encoding.Primitive, class: Class.Universal, padding: '000000' },
  ],
  [
    new BitStringNode('011011100101110111', '100000'),
    { data: '011011100101110111', encoding: Encoding.Primitive, class: Class.Universal, padding: '100000' },
  ],
  [
    new BitStringNode(Buffer.from([0x06, 0x6e, 0x5d, 0xc0])),
    { data: '011011100101110111', encoding: Encoding.Primitive, class: Class.Universal, padding: '000000' },
  ],
  [
    new BitStringNode([new BitStringNode(Buffer.from([0x00, 0x6e, 0x5d])), new BitStringNode('11')]),
    {
      data: [
        { data: '0110111001011101', encoding: Encoding.Primitive, class: Class.Universal, padding: '' },
        { data: '11', encoding: Encoding.Primitive, class: Class.Universal, padding: '000000' },
      ],
      encoding: Encoding.Constructed,
      class: Class.Universal,
      padding: '',
    },
  ],
  [
    new BitStringNode([
      new BitStringNode([new BitStringNode('11010011'), new BitStringNode('01101')]),
      new BitStringNode([new BitStringNode('')]),
      new BitStringNode('11'),
    ]),
    {
      data: [
        {
          data: [
            { data: '11010011', encoding: Encoding.Primitive, class: Class.Universal, padding: '' },
            { data: '01101', encoding: Encoding.Primitive, class: Class.Universal, padding: '000' },
          ],
          encoding: Encoding.Constructed,
          class: Class.Universal,
          padding: '',
        },
        {
          data: [{ data: '', encoding: Encoding.Primitive, class: Class.Universal, padding: '' }],
          encoding: Encoding.Constructed,
          class: Class.Universal,
          padding: '',
        },
        { data: '11', encoding: Encoding.Primitive, class: Class.Universal, padding: '000000' },
      ],
      encoding: Encoding.Constructed,
      class: Class.Universal,
      padding: '',
    },
  ],
];

const paddings: string[] = ['', '10000', '1000001', '222222'];

describe('BitString Node', () => {
  it.each(failures)('should fail when instantiating with an invalid data.', (data) => {
    expect(() => new BitStringNode(data)).toThrow(TypeError);
  });

  it.each(paddings)('should fail when instatiating with an invalid padding.', (padding) => {
    expect(() => new BitStringNode('011011100101110111', padding)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new BitString Node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
