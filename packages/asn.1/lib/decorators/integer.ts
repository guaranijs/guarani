import { Optional } from '@guarani/types';

import { Class } from '../class';
import { setInternalElement } from '../metadata/helpers';
import { Encoding } from '../encoding';
import { IntegerNode } from '../nodes/integer.node';
import { NodeOptions } from '../nodes/node.options';
import { Type } from '../type';

/**
 * Declares a property as an Integer Type.
 *
 * @param options Optional parameters.
 */
export function Integer(options: Optional<NodeOptions> = {}): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    if (options.encoding !== undefined) {
      throw new Error('Unsupported option "encoding".');
    }

    options.class ??= Class.Universal;
    options.encoding = Encoding.Primitive;

    setInternalElement(target, { NodeConstructor: IntegerNode, options, propertyKey, type: Type.Integer });
  };
}
