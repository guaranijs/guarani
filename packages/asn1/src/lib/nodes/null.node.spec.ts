import { Asn1Class } from '../../lib/asn1-class.enum';
import { Asn1Encoding } from '../../lib/asn1-encoding.enum';
import { NullNode } from '../../lib/nodes/null.node';

const instances: [NullNode, object][] = [
  [new NullNode(), { data: null, encoding: Asn1Encoding.Primitive, class: Asn1Class.Universal }],
];

describe('Null Node', () => {
  it.each(instances)('should instantiate a new null node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
