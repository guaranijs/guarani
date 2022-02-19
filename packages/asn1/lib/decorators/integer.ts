import { Optional } from '@guarani/types';

import { Class } from '../class';
import { setInternalNodeElement } from '../metadata/helpers';
import { Method } from '../method';
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
    if (typeof options.method !== 'undefined' && options.method !== Method.Primitive) {
      throw new Error('Unsupported option "method".');
    }

    options.class ??= Class.Universal;
    options.method = Method.Primitive;

    setInternalNodeElement(target, {
      node: IntegerNode,
      options,
      propertyKey,
      type: Type.Integer,
    });
  };
}
