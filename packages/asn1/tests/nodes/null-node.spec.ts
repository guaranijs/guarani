import { Class } from '../../lib/class';
import { Encoding } from '../../lib/encoding';
import { NullNode } from '../../lib/nodes/null.node';

const instances: [NullNode, object][] = [
  [new NullNode(), { data: null, encoding: Encoding.Primitive, class: Class.Universal }],
];

describe('Null Node', () => {
  it.each(instances)('should instantiate a new Null Node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
