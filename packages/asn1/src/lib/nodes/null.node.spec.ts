import { NullNode } from './null.node';

const instances: [NullNode, object][] = [[new NullNode(), { data: null, encoding: 'primitive', class: 'universal' }]];

describe('Null Node', () => {
  it.each(instances)('should instantiate a new null node.', (node, expected) => {
    expect(node).toMatchObject(expected);
  });
});
