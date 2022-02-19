import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Encoding } from '../encoding';
import { setInternalElement } from '../metadata/helpers';
import { BooleanNode } from '../nodes/boolean.node';
import { NodeOptions } from '../nodes/node.options';
import { Type } from '../type';

/**
 * Declares a property as a Boolean Type.
 *
 * @param options Optional parameters.
 */
export function Boolean(options: Optional<NodeOptions> = {}): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    if (options.encoding !== undefined) {
      throw new Error('Unsupported option "encoding".');
    }

    options.class ??= Class.Universal;
    options.encoding = Encoding.Primitive;

    setInternalElement(target, { NodeConstructor: BooleanNode, options, propertyKey, type: Type.Boolean });
  };
}
