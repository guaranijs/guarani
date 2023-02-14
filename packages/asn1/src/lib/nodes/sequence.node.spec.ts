import { Buffer } from 'buffer';

import { Asn1Class } from '../../lib/asn1-class.enum';
import { Asn1Encoding } from '../../lib/asn1-encoding.enum';
import { IntegerNode } from '../../lib/nodes/integer.node';
import { NullNode } from '../../lib/nodes/null.node';
import { SequenceNode } from '../../lib/nodes/sequence.node';

const failures: any[] = [undefined, null, true, 123.45, 123, 123n, 'foo', Buffer.from('hello'), {}, [], [123]];

const instances: [SequenceNode, object][] = [
  [
    new SequenceNode([new IntegerNode(0x010001), new NullNode()]),
    {
      data: [
        { data: 65537n, encoding: Asn1Encoding.Primitive, class: Asn1Class.Universal },
        { data: null, encoding: Asn1Encoding.Primitive, class: Asn1Class.Universal },
      ],
      encoding: Asn1Encoding.Constructed,
      class: Asn1Class.Universal,
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
