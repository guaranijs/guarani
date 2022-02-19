import { Class } from '../../lib/class';
import { Encoding } from '../../lib/encoding';
import { IntegerNode } from '../../lib/nodes/integer.node';

const failures: any[] = [undefined, null, false, 123.45, 'foo', [], {}, Buffer.from('hello')];

const instances: [IntegerNode, object][] = [
  [new IntegerNode(0), { data: 0n, encoding: Encoding.Primitive, class: Class.Universal }],
  [new IntegerNode(1), { data: 1n, encoding: Encoding.Primitive, class: Class.Universal }],
  [new IntegerNode(-1), { data: -1n, encoding: Encoding.Primitive, class: Class.Universal }],
  [new IntegerNode(0n), { data: 0n, encoding: Encoding.Primitive, class: Class.Universal }],
  [new IntegerNode(1n), { data: 1n, encoding: Encoding.Primitive, class: Class.Universal }],
  [new IntegerNode(-1n), { data: -1n, encoding: Encoding.Primitive, class: Class.Universal }],
];

describe('Integer Node', () => {
  it.each(failures)('should fail when instantiating with a non-integer data.', (data) => {
    expect(() => new IntegerNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new Integer Node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
