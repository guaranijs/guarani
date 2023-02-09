import { Constructor } from '../types/constructor.interface';
import { TokenDescriptor } from '../types/token.descriptor';

/**
 * Registers the data provided into the Token Descriptor based on the provided parameters.
 *
 * @param metadataKey Metadata Key used to define the Token Descriptor.
 * @param target Object where the Token Descriptor will be defined.
 * @param propertyOrIndex Property name or constructor parameter index.
 * @param descriptor Data to be set at the Token Descriptor.
 */
export function setTokenDescriptor<T>(
  metadataKey: string | symbol,
  target: object | Constructor<T>,
  propertyOrIndex: string | symbol | number,
  descriptor: Partial<TokenDescriptor<T>>
): void {
  const tokenDescriptors: Map<string | symbol | number, TokenDescriptor<T>> = Reflect.getMetadata(
    metadataKey,
    target
  ) ?? new Map();

  const tokenDescriptor = tokenDescriptors.get(propertyOrIndex) ?? <TokenDescriptor<T>>{};

  Object.assign<TokenDescriptor<T>, Partial<TokenDescriptor<T>>>(tokenDescriptor, descriptor);
  tokenDescriptors.set(propertyOrIndex, tokenDescriptor);
  Reflect.defineMetadata(metadataKey, tokenDescriptors, target);
}
