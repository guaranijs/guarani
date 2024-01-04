import { Buffer } from 'buffer';

import { IntegerNode } from './integer.node';
import { NullNode } from './null.node';
import { SequenceNode } from './sequence.node';

const failures: any[] = [undefined, null, true, 123.45, 123, 123n, 'foo', Buffer.from('hello'), {}, [], [123]];

const instances: [SequenceNode, object][] = [
  [
    new SequenceNode([new IntegerNode(0x010001), new NullNode()]),
    {
      data: [
        { data: 65537n, encoding: 'primitive', class: 'universal' },
        { data: null, encoding: 'primitive', class: 'universal' },
      ],
      encoding: 'constructed',
      class: 'universal',
    },
  ],
];

describe('Sequence Node', () => {
  it.each(failures)('should fail when instantiating with an invalid data.', (data) => {
    expect(() => new SequenceNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new sequence node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
