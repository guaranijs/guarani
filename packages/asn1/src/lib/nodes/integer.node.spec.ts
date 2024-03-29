import { Buffer } from 'buffer';

import { IntegerNode } from './integer.node';

const failures: any[] = [undefined, null, false, 123.45, 'foo', [], {}, Buffer.from('hello')];

const instances: [IntegerNode, object][] = [
  [new IntegerNode(0), { data: 0n, encoding: 'primitive', class: 'universal' }],
  [new IntegerNode(1), { data: 1n, encoding: 'primitive', class: 'universal' }],
  [new IntegerNode(-1), { data: -1n, encoding: 'primitive', class: 'universal' }],
  [new IntegerNode(0n), { data: 0n, encoding: 'primitive', class: 'universal' }],
  [new IntegerNode(1n), { data: 1n, encoding: 'primitive', class: 'universal' }],
  [new IntegerNode(-1n), { data: -1n, encoding: 'primitive', class: 'universal' }],
];

describe('Integer Node', () => {
  it.each(failures)('should fail when instantiating with a non-integer data.', (data) => {
    expect(() => new IntegerNode(data)).toThrow(TypeError);
  });

  it.each(instances)('should instantiate a new integer node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
