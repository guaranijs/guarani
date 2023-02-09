import { DependencyInjectionException } from './dependency-injection.exception';

/**
 * Thrown when the provided object is not a valid Provider.
 */
export class InvalidProviderException extends DependencyInjectionException {
  /**
   * Thrown when the provided object is not a valid Provider.
   *
   * @param obj Object used as a Provider.
   */
  public constructor(obj: unknown) {
    const serializedObject = InvalidProviderException.getSerializedObject(obj);
    const message = `The object "${serializedObject}" is not a valid Provider.`;

    super(message);
  }

  /**
   * Returns a String description of the object for use at the Exception's Message.
   *
   * @param obj Object used as a Provider.
   * @returns String description of the object.
   */
  private static getSerializedObject(obj: unknown): string {
    switch (typeof obj) {
      case 'bigint':
        return String(obj);

      case 'function':
        return obj.name;

      case 'symbol':
        return obj.toString();

      case 'undefined':
        return 'undefined';

      default:
        return JSON.stringify(obj);
    }
  }
}
