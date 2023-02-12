/**
 * OAuth 2.0 End User Entity.
 */
export interface User extends Record<string, any> {
  /**
   * Identifier of the End User.
   */
  readonly id: string;
}
