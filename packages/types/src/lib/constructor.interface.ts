import { AbstractConstructor } from './abstract-constructor.interface';

/**
 * Denotes the Constructor Type of the provided Generic.
 */
export interface Constructor<T> extends AbstractConstructor<T> {
  /**
   * Signature of the Constructor Type's constructor method.
   */
  new (...args: any[]): T;
}
