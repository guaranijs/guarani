import { Optional } from '@guarani/types';

import { Class } from '../class';
import { getDesignPropType, setInternalElement } from '../metadata/helpers';
import { NodeOptions as BaseNodeOptions } from '../nodes/node.options';
import { OctetStringNode } from '../nodes/octetstring.node';
import { Type } from '../type';

type NodeOptions = Required<Pick<BaseNodeOptions, 'encoding'>> & Optional<BaseNodeOptions>;

/**
 * Declares a property as a OctetString Type.
 *
 * @param options Optional parameters.
 */
export function OctetString(options: NodeOptions): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    if (options.encoding === undefined) {
      throw new TypeError('Invalid option "encoding".');
    }

    options.class ??= Class.Universal;

    setInternalElement(target, {
      Model: getDesignPropType(target, propertyKey),
      NodeConstructor: OctetStringNode,
      options,
      propertyKey,
      type: Type.OctetString,
    });
  };
}
