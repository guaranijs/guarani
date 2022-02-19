import { SequenceNode } from '../../lib/nodes/sequence.node';

describe('Sequence Node', () => {
  it('should fail when instantiating with an invalid data.', () => {
    // @ts-expect-error
    expect(() => new SequenceNode()).toThrow();

    // @ts-expect-error
    expect(() => new SequenceNode(null)).toThrow();

    // @ts-expect-error
    expect(() => new SequenceNode(true)).toThrow();

    // @ts-expect-error
    expect(() => new SequenceNode(123.45)).toThrow();

    // @ts-expect-error
    expect(() => new SequenceNode(123)).toThrow();

    // @ts-expect-error
    expect(() => new SequenceNode(123n)).toThrow();

    // @ts-expect-error
    expect(() => new SequenceNode({})).toThrow();

    // @ts-expect-error
    expect(() => new SequenceNode([1, 2, 3])).toThrow();

    // @ts-expect-error
    expect(() => new SequenceNode(Buffer.from([0x12, 0x3f]))).toThrow();
  });

  it.todo('should instantiate a new Sequence Node.');

  it.todo('should have a Node array as its data.');

  it.todo('should check whether or not a Buffer is Sequence encoded.');

  it.todo('should encode a Sequence Node.');
});
