import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Encoding } from '../encoding';

/**
 * Optional attributes of the Node.
 */
export interface NodeOptions {
  /**
   * Encoding of the Node.
   */
  encoding?: Optional<Encoding>;

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
