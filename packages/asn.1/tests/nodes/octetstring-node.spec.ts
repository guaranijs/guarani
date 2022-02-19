import { Class } from '../../lib/class';
import { Encoding } from '../../lib/encoding';
import { OctetStringNode } from '../../lib/nodes/octetstring.node';

const failures: any[] = [undefined, null, true, 123, 123.45, 123n, 'foo', {}, [123]];

const instances: [OctetStringNode, object][] = [
  [new OctetStringNode('0fc45d9132ab'), { data: '0fc45d9132ab', encoding: Encoding.Primitive, class: Class.Universal }],
  [
    new OctetStringNode(Buffer.from([0x0f, 0xc4, 0x5d, 0x91, 0x32, 0xab])),
    { data: '0fc45d9132ab', encoding: Encoding.Primitive, class: Class.Universal },
  ],
  [
    new OctetStringNode([new OctetStringNode('fc45d'), new OctetStringNode(Buffer.from([0x91, 0x32, 0xab]))]),
    {
      data: [
        { data: '0fc45d', encoding: Encoding.Primitive, class: Class.Universal },
        { data: '9132ab', encoding: Encoding.Primitive, class: Class.Universal },
      ],
      encoding: Encoding.Constructed,
      class: Class.Universal,
    },
  ],
];

describe('OctetString Node', () => {
  it.each(failures)('should fail when instantiating with an invalid data.', (data) => {
    expect(() => new OctetStringNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new OctetString Node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
