import { Buffer } from 'buffer';

import { BooleanNode } from './boolean.node';

const failures: any[] = [undefined, null, 123, 123.45, 123n, 'foo', [], {}, Buffer.from('hello')];

const instances: [BooleanNode, object][] = [
  [new BooleanNode(true), { data: true, encoding: 'primitive', class: 'universal' }],
  [new BooleanNode(false), { data: false, encoding: 'primitive', class: 'universal' }],
];

describe('Boolean Node', () => {
  it.each(failures)('should fail when instantiating with a non-boolean data.', (data) => {
    expect(() => new BooleanNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new boolean node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
