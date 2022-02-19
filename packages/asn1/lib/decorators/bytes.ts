import { setInternalNodeElement } from '../metadata/helpers';
import { Type } from '../type';

/**
 * Declares a property as a Bytes Type.
 *
 * The bytes type is an internal type used to indicate that the contents
 * of the property is not enveloped in any ASN.1 Type.
 *
 * This is useful, for example, to decode the (x, y) parameters
 * of a SEC 1 Encoded Elliptic Curve Public Key.
 *
 * @param length Length in bytes of the decorated parameter.
 * @param transformer Optional post-processing done on the obtained buffer.
 */
export function Bytes(length: number): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    setInternalNodeElement(target, {
      type: Type.Bytes,
      node: null!,
      propertyKey,
      bytesLength: length,
    });
  };
}
