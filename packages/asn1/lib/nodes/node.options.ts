import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Method } from '../method';

/**
 * Optional attributes of the Node.
 */
export interface NodeOptions {
  /**
   * Method of the Node.
   */
  method?: Optional<Method>;

  /**
   * Class of the Node.
   */
  class?: Optional<Class>;

  /**
   * Explicit Tag Identifier of the Node.
   */
  explicit?: Optional<number>;

  /**
   * Implicit Tag Identifier of the Node.
   */
  implicit?: Optional<number>;
}
