import { Node } from './node';
import { NodeOptions } from './node.options';

describe('Node', () => {
  it('should throw when defining both explicit and implicit tagging methods.', () => {
    expect(() => Reflect.construct(Node, ['', <NodeOptions>{ explicit: 0x00, implicit: 0x01 }])).toThrow(
      new Error('A Node cannot have both EXPLICIT and IMPLICIT Tags.'),
    );
  });

  it.each<NodeOptions>([
    { class: 'universal', explicit: 0x00 },
    { class: 'universal', implicit: 0x00 },
  ])('should throw when using tagging and universal class.', (options) => {
    expect(() => Reflect.construct(Node, ['', options])).toThrow(
      new Error('No Universal Class Tag allowed when tagging.'),
    );
  });

  it.each<NodeOptions>([{ class: 'application' }, { class: 'contextspecific' }, { class: 'private' }])(
    'should throw when not using a universal class not providing either an explicit or implicit tag.',
    (options) => {
      expect(() => Reflect.construct(Node, ['', options])).toThrow(
        new Error('A Tagged Type must have an EXPLICIT or IMPLICIT Tag.'),
      );
    },
  );
});
