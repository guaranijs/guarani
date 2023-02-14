import { Buffer } from 'buffer';

import { Asn1Class } from '../../lib/asn1-class.enum';
import { Asn1Encoding } from '../../lib/asn1-encoding.enum';
import { ObjectIdentifierNode } from '../../lib/nodes/object-identifier.node';

const failures: any[] = [
  undefined,
  null,
  true,
  123,
  123.45,
  123n,
  {},
  Buffer.from('hello'),
  '',
  '1',
  '-1.2.840.113549',
  '3.2.840.113549',
  '0.40.840.113549',
  '1.40.840.113549',
  [],
  [1],
  [-1, 2, 840, 113549],
  [3, 2, 840, 113549],
  [0, 40, 840, 113549],
  [1, 40, 840, 113549],
  [1, 2, 840, 113549.999],
];

const instances: [ObjectIdentifierNode, object][] = [
  [
    new ObjectIdentifierNode('1.2.840.113549'),
    { data: '1.2.840.113549', encoding: Asn1Encoding.Primitive, class: Asn1Class.Universal },
  ],
  [
    new ObjectIdentifierNode([1, 2, 840, 113549]),
    { data: '1.2.840.113549', encoding: Asn1Encoding.Primitive, class: Asn1Class.Universal },
  ],
];

describe('ObjectIdentifier Node', () => {
  it.each(failures)('should fail when instantiating with an invalid data.', (data) => {
    expect(() => new ObjectIdentifierNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new object identifier node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
