import { Optional } from '@guarani/types';

import { Class } from '../class';
import { setInternalNodeElement } from '../metadata/helpers';
import { Method } from '../method';
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
    if (typeof options.method !== 'undefined' && options.method !== Method.Primitive) {
      throw new Error('Unsupported option "method".');
    }

    options.class ??= Class.Universal;
    options.method = Method.Primitive;

    setInternalNodeElement(target, {
      node: BooleanNode,
      options,
      propertyKey,
      type: Type.Boolean,
    });
  };
}
