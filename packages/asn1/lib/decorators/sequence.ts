import { Optional } from '@guarani/types';

import { Class } from '../class';
import { setRootNodeElement } from '../metadata/helpers';
import { Method } from '../method';
import { NodeOptions } from '../nodes/node.options';
import { SequenceNode } from '../nodes/sequence.node';
import { Type } from '../type';

/**
 * Declares a class as a Sequence Type.
 *
 * @param options Optional parameters.
 */
export function Sequence(options: Optional<NodeOptions> = {}): ClassDecorator {
  return function <TFunction extends Function>(target: TFunction): void {
    if (typeof options.method !== 'undefined' && options.method !== Method.Constructed) {
      throw new Error('Unsupported option "method".');
    }

    options.class ??= Class.Universal;
    options.method = Method.Constructed;

    setRootNodeElement(target.prototype, {
      node: SequenceNode,
      options,
      type: Type.Sequence,
    });
  };
}
