import { Optional } from '@guarani/types';

import { Class } from '../class';
import { getDesignPropType, setInternalNodeElement } from '../metadata/helpers';
import { Method } from '../method';
import { BitStringNode } from '../nodes/bitstring.node';
import { NodeOptions } from '../nodes/node.options';
import { Type } from '../type';

/**
 * Declares a property as a BitString Type.
 *
 * @param options Optional parameters.
 */
export function BitString(options: Optional<NodeOptions> = {}): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    if (options.method === Method.Constructed) {
      throw new Error('Unsupported Constructed Method for BitString.');
    }

    options.class ??= Class.Universal;
    options.method ??= Method.Primitive;

    setInternalNodeElement(target, {
      model: getDesignPropType(target, propertyKey),
      node: BitStringNode,
      options,
      propertyKey,
      type: Type.BitString,
    });
  };
}
