/**
 * Defines a Metadata on the provided Authorization Server.
 *
 * @param name Name of the metadata.
 * @param value Value of the metadata.
 * @param target Authorization Server Constructor.
 */
export function defineMetadata<T>(name: any, value: T, target: Function): void {
  Reflect.defineMetadata(name, value, target);
}
