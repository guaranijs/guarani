import { Class } from '../../lib/class';
import { Encoding } from '../../lib/encoding';
import { BooleanNode } from '../../lib/nodes/boolean.node';

const failures: any[] = [undefined, null, 123, 123.45, 123n, 'foo', [], {}, Buffer.from('hello')];

const instances: [BooleanNode, object][] = [
  [new BooleanNode(true), { data: true, encoding: Encoding.Primitive, class: Class.Universal }],
  [new BooleanNode(false), { data: false, encoding: Encoding.Primitive, class: Class.Universal }],
];

describe('Boolean Node', () => {
  it.each(failures)('should fail when instantiating with a non-boolean data.', (data) => {
    expect(() => new BooleanNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new Boolean Node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
