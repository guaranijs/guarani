import { Optional } from '@guarani/types';

import { MetadataToken } from '../metadata-token';

/**
 * Returns the metadata registered at the Authorization Server Constructor.
 *
 * @param name Name of the metadata.
 * @param target Authorization Server Constructor.
 * @returns Value of the metadata.
 */
export function getMetadata<T = any>(name: MetadataToken, target: Function): Optional<T> {
  return Reflect.getMetadata(name, target);
}
