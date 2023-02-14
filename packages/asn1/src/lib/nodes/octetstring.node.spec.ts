import { Buffer } from 'buffer';

import { Asn1Class } from '../../lib/asn1-class.enum';
import { Asn1Encoding } from '../../lib/asn1-encoding.enum';
import { OctetStringNode } from '../../lib/nodes/octetstring.node';

const failures: any[] = [undefined, null, true, 123, 123.45, 123n, 'foo', {}, [123]];

const instances: [OctetStringNode, object][] = [
  [
    new OctetStringNode('0fc45d9132ab'),
    {
      data: Buffer.from([0x0f, 0xc4, 0x5d, 0x91, 0x32, 0xab]),
      encoding: Asn1Encoding.Primitive,
      class: Asn1Class.Universal,
    },
  ],
  [
    new OctetStringNode(Buffer.from([0x0f, 0xc4, 0x5d, 0x91, 0x32, 0xab])),
    {
      data: Buffer.from([0x0f, 0xc4, 0x5d, 0x91, 0x32, 0xab]),
      encoding: Asn1Encoding.Primitive,
      class: Asn1Class.Universal,
    },
  ],
  [
    new OctetStringNode([new OctetStringNode('fc45d'), new OctetStringNode(Buffer.from([0x91, 0x32, 0xab]))]),
    {
      data: [
        { data: Buffer.from([0x0f, 0xc4, 0x5d]), encoding: Asn1Encoding.Primitive, class: Asn1Class.Universal },
        { data: Buffer.from([0x91, 0x32, 0xab]), encoding: Asn1Encoding.Primitive, class: Asn1Class.Universal },
      ],
      encoding: Asn1Encoding.Constructed,
      class: Asn1Class.Universal,
    },
  ],
];

describe('OctetString Node', () => {
  it.each(failures)('should fail when instantiating with an invalid data.', (data) => {
    expect(() => new OctetStringNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new octet string node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
