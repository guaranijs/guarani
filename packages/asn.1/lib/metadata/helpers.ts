import { Constructor, Maybe, Optional } from '@guarani/types';

import { Transformer } from '../transformer';
import { InternalElement } from './elements/internal.element';
import { RootElement } from './elements/root.element';
import { MetadataToken } from './metadata-token';

/**
 * Defines a Root Element on the provided target.
 *
 * @param target Object to be decorated.
 * @param element Object used to define a Root Element.
 */
export function setRootElement(target: Object, element: RootElement): void {
  Reflect.defineMetadata(MetadataToken.ASN1_ROOT_ELEMENT, element, target);
}

/**
 * Returns the Root Element of the target object.
 *
 * @param target Object inspected.
 * @returns Root Element of the target object.
 */
export function getRootElement(target: Object): RootElement {
  return <RootElement>Reflect.getMetadata(MetadataToken.ASN1_ROOT_ELEMENT, target);
}

/**
 * Defines an Internal Element on the provided target.
 *
 * @param target Object to be decorated.
 * @param element Object used to define an Internal Element.
 */
export function setInternalElement(target: Object, element: InternalElement): void {
  const collection = <InternalElement[]>Reflect.getMetadata(MetadataToken.ASN1_INTERNAL_ELEMENTS, target) ?? [];
  collection.push(element);
  Reflect.defineMetadata(MetadataToken.ASN1_INTERNAL_ELEMENTS, collection, target);
}

/**
 * Returns the Internal Elements of the target object.
 *
 * @param target Object inspected.
 * @returns Internal Elements of the target object.
 */
export function getInternalElements(target: Object): InternalElement[] {
  return <InternalElement[]>Reflect.getMetadata(MetadataToken.ASN1_INTERNAL_ELEMENTS, target);
}

/**
 * Sets the Transformer Functions of the target's property.
 *
 * @param target Object to be decorated.
 * @param propertyKey Property Key of the object.
 * @param transformOptions Transformers to be registered.
 */
export function setTransformer(target: Object, propertyKey: string | symbol, transformOptions: Transformer): void {
  const transformers: Record<string | symbol, Transformer> =
    Reflect.getMetadata(MetadataToken.ASN1_TRANSFORMERS, target) ?? {};

  transformers[propertyKey] = transformOptions;

  Reflect.defineMetadata(MetadataToken.ASN1_TRANSFORMERS, transformers, target);
}

/**
 * Returns the Transformer Functions of the target's property.
 *
 * @param target Object inspected.
 * @param propertyKey Property to be inspected.
 * @returns Transformer Functions of the target's property.
 */
export function getTransformer(target: Object, propertyKey: string | symbol): Maybe<Transformer> {
  const transformers: Optional<Record<string | symbol, Transformer>> = Reflect.getMetadata(
    MetadataToken.ASN1_TRANSFORMERS,
    target
  );

  return transformers?.[propertyKey];
}

/**
 * Checks whether or not the provided constructor is primitive.
 *
 * @param type Constructor to be checked.
 * @returns Result of the check.
 */
function _isPrimitiveConstructor(type: Constructor): boolean {
  return type === null || type === Object || !Reflect.hasMetadata(MetadataToken.ASN1_ROOT_ELEMENT, type.prototype);
}

/**
 * Returns the type of the requested property.
 *
 * @param target Constructor to be inspected.
 * @param propertyKey Name of the property.
 * @returns Type of the property.
 */
export function getDesignPropType(target: Object, propertyKey: string | symbol): Maybe<Constructor> {
  const propType = Reflect.getMetadata(MetadataToken.DESIGN_PROP_TYPE, target, propertyKey);
  return _isPrimitiveConstructor(propType) ? undefined : propType;
}
