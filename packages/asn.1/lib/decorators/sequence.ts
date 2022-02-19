import { Optional } from '@guarani/types';

import { Class } from '../class';
import { setRootElement } from '../metadata/helpers';
import { Encoding } from '../encoding';
import { NodeOptions } from '../nodes/node.options';
import { SequenceNode } from '../nodes/sequence.node';
import { Type } from '../type';

/**
 * Declares a class as a Sequence Type.
 *
 * @param options Optional parameters.
 */
export function Sequence(options: Optional<NodeOptions> = {}): ClassDecorator {
  return function (target: Function): void {
    if (options.encoding !== undefined) {
      throw new Error('Unsupported option "encoding".');
    }

    options.class ??= Class.Universal;
    options.encoding = Encoding.Constructed;

    setRootElement(target.prototype, { NodeConstructor: SequenceNode, options, type: Type.Sequence });
  };
}
