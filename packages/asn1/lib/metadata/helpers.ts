import { Constructor, Maybe, Optional } from '@guarani/types';

import { InternalNodeElement } from './elements/internal-node.element';
import { RootNodeElement } from './elements/root-node.element';
import { MetadataToken } from './metadata-token';
import { Transformer, TransformerOperation } from './transformer';

/**
 * Defines a Root Node Element on the provided target.
 *
 * @param target Object to be decorated.
 * @param element Object used to define a Root Node Element.
 */
export function setRootNodeElement(target: object, element: RootNodeElement): void {
  Reflect.defineMetadata(MetadataToken.ASN1_ROOT_NODE_ELEMENT, element, target);
}

/**
 * Defines an Internal Node Element on the provided target.
 *
 * @param target Object to be decorated.
 * @param element Object used to define an Internal Node Element.
 */
export function setInternalNodeElement(target: object, element: InternalNodeElement): void {
  const collection =
    <InternalNodeElement[]>Reflect.getMetadata(MetadataToken.ASN1_INTERNAL_NODE_ELEMENTS, target) ?? [];

  collection.push(element);

  Reflect.defineMetadata(MetadataToken.ASN1_INTERNAL_NODE_ELEMENTS, collection, target);
}

/**
 * Returns the Root Node Element of the target object.
 *
 * @param target Object inspected.
 * @returns Root Node Element of the target object.
 */
export function getRootNodeElement(target: object): RootNodeElement {
  return <RootNodeElement>Reflect.getMetadata(MetadataToken.ASN1_ROOT_NODE_ELEMENT, target);
}

/**
 * Returns the Internal Node Elements of the target object.
 *
 * @param target Object inspected.
 * @returns Internal Node Elements of the target object.
 */
export function getInternalNodeElements(target: object): InternalNodeElement[] {
  return <InternalNodeElement[]>Reflect.getMetadata(MetadataToken.ASN1_INTERNAL_NODE_ELEMENTS, target);
}

/**
 * Returns the collection of transformer functions of the property.
 *
 * @param target Object inspected.
 * @param propertyKey Property to be inspected.
 * @returns Collection of transformer functions of the property.
 */
export function getTransformers(target: object, propertyKey: string | symbol): Maybe<Transformer[]> {
  const transformers: Optional<Map<string | symbol, Transformer[]>> = Reflect.getMetadata(
    MetadataToken.ASN1_TRANSFORMERS,
    target
  );

  return transformers?.get(propertyKey);
}

/**
 * Sets the provided transformer for the provided property.
 *
 * @param target Object inspected.
 * @param propertyKey Property to be modified.
 * @param transformer New transformer function for the property.
 */
export function setTransformer(
  target: object,
  propertyKey: string | symbol,
  transformer: (value: any) => any,
  operation: TransformerOperation
): void {
  const transformers: Map<string | symbol, Transformer[]> =
    Reflect.getMetadata(MetadataToken.ASN1_TRANSFORMERS, target) ?? new Map();

  Reflect.defineMetadata(MetadataToken.ASN1_TRANSFORMERS, transformers, target);

  if (!transformers.has(propertyKey)) {
    transformers.set(propertyKey, []);
  }

  transformers.get(propertyKey)!.push({ operation, transformer });
}

/**
 * Checks whether or not the provided constructor is primitive.
 *
 * @param type Constructor to be checked.
 * @returns Result of the check.
 */
function _isPrimitiveConstructor(type: Constructor): boolean {
  return type === null || type === Object || !Reflect.hasMetadata(MetadataToken.ASN1_ROOT_NODE_ELEMENT, type.prototype);
}

/**
 * Returns the type of the requested property.
 *
 * @param target Constructor to be inspected.
 * @param propertyKey Name of the property.
 * @returns Type of the property.
 */
export function getDesignPropType(target: object, propertyKey: string | symbol): any {
  const propType = Reflect.getMetadata(MetadataToken.DESIGN_PROP_TYPE, target, propertyKey);

  return _isPrimitiveConstructor(propType) ? undefined : propType;
}
