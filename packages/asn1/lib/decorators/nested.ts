import { Optional } from '@guarani/types';

import { getDesignPropType, setInternalNodeElement, setRootNodeElement } from '../metadata/helpers';
import { Type } from '../type';

/**
 * Declares a class or property as a Nested Type.
 *
 * A nested type is an internal type used to indicate that the class
 * will not have a Root Node Element, or that a property will not
 * process the data at the parent class' level.
 */
export function Nested(): ClassDecorator & PropertyDecorator {
  return function (target: Function | object, propertyKey?: Optional<string | symbol>): void {
    if (typeof propertyKey === 'undefined') {
      setRootNodeElement((<Function>target).prototype, {
        node: null!,
        type: Type.Nested,
      });
    } else {
      setInternalNodeElement(target, {
        model: getDesignPropType(target, propertyKey),
        node: null!,
        propertyKey,
        type: Type.Nested,
      });
    }
  };
}
