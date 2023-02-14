import { Buffer } from 'buffer';

import { Asn1Class } from '../../lib/asn1-class.enum';
import { Asn1Encoding } from '../../lib/asn1-encoding.enum';
import { BooleanNode } from '../../lib/nodes/boolean.node';

const failures: any[] = [undefined, null, 123, 123.45, 123n, 'foo', [], {}, Buffer.from('hello')];

const instances: [BooleanNode, object][] = [
  [new BooleanNode(true), { data: true, encoding: Asn1Encoding.Primitive, class: Asn1Class.Universal }],
  [new BooleanNode(false), { data: false, encoding: Asn1Encoding.Primitive, class: Asn1Class.Universal }],
];

describe('Boolean Node', () => {
  it.each(failures)('should fail when instantiating with a non-boolean data.', (data) => {
    expect(() => new BooleanNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new boolean node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
