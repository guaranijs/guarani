import { Dict } from '@guarani/types';

/**
 * OAuth 2.0 End User Entity.
 */
export interface User extends Dict {
  /**
   * Identifier of the End User.
   */
  readonly id: string;
}
