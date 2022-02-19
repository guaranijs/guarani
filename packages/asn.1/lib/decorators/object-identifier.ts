import { Optional } from '@guarani/types';

import { Class } from '../class';
import { setInternalElement } from '../metadata/helpers';
import { Encoding } from '../encoding';
import { NodeOptions } from '../nodes/node.options';
import { ObjectIdentifierNode } from '../nodes/object-identifier.node';
import { Type } from '../type';

/**
 * Declares a property as an ObjectIdentifier Type.
 *
 * @param options Optional parameters.
 */
export function ObjectIdentifier(options: Optional<NodeOptions> = {}): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    if (options.encoding !== undefined) {
      throw new Error('Unsupported option "encoding".');
    }

    options.class ??= Class.Universal;
    options.encoding = Encoding.Primitive;

    setInternalElement(target, {
      NodeConstructor: ObjectIdentifierNode,
      options,
      propertyKey,
      type: Type.ObjectIdentifier,
    });
  };
}
