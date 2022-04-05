import { Class } from '../../lib/class';
import { Encoding } from '../../lib/encoding';
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
    { data: '1.2.840.113549', encoding: Encoding.Primitive, class: Class.Universal },
  ],
  [
    new ObjectIdentifierNode([1, 2, 840, 113549]),
    { data: '1.2.840.113549', encoding: Encoding.Primitive, class: Class.Universal },
  ],
];

describe('ObjectIdentifier Node', () => {
  it.each(failures)('should fail when instantiating with an invalid data.', (data) => {
    expect(() => new ObjectIdentifierNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new ObjectIdentifier Node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
