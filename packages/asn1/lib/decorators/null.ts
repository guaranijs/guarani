import { Optional } from '@guarani/types';

import { Class } from '../class';
import { setInternalNodeElement } from '../metadata/helpers';
import { Method } from '../method';
import { NodeOptions } from '../nodes/node.options';
import { NullNode } from '../nodes/null.node';
import { Type } from '../type';

/**
 * Declares a property as a Null Type.
 *
 * @param options Optional parameters.
 */
export function Null(options: Optional<NodeOptions> = {}): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    if (typeof options.method !== 'undefined' && options.method !== Method.Primitive) {
      throw new Error('Unsupported option "method".');
    }

    options.class ??= Class.Universal;
    options.method = Method.Primitive;

    setInternalNodeElement(target, {
      node: NullNode,
      options,
      propertyKey,
      type: Type.Null,
    });
  };
}
