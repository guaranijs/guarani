import { Constructor } from '@guarani/types';

/**
 * Decorator to force a class to implement a static member.
 */
export function StaticInterface<T extends Constructor>() {
  return (staticInterface: T) => staticInterface;
}
