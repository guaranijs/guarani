import { Class } from '../../lib/class';
import { Encoding } from '../../lib/encoding';
import { IntegerNode } from '../../lib/nodes/integer.node';
import { NullNode } from '../../lib/nodes/null.node';
import { SequenceNode } from '../../lib/nodes/sequence.node';

const failures: any[] = [undefined, null, true, 123.45, 123, 123n, 'foo', Buffer.from('hello'), {}, [], [123]];

const instances: [SequenceNode, object][] = [
  [
    new SequenceNode([new IntegerNode(0x010001), new NullNode()]),
    {
      data: [
        { data: 65537n, encoding: Encoding.Primitive, class: Class.Universal },
        { data: null, encoding: Encoding.Primitive, class: Class.Universal },
      ],
      encoding: Encoding.Constructed,
      class: Class.Universal,
    },
  ],
];

describe('Sequence Node', () => {
  it.each(failures)('should fail when instantiating with an invalid data.', (data) => {
    expect(() => new SequenceNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new Sequence Node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
