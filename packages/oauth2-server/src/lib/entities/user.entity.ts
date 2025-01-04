import { Dictionary } from '@guarani/types';

/**
 * OAuth 2.0 End User Entity.
 */
export abstract class User implements Dictionary<unknown> {
  /**
   * Identifier of the End User.
   */
  public readonly id!: string;

  /**
   * Additional User Parameters.
   */
  [parameter: string]: unknown;
}
