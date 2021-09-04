/**
 * Defines the model of the `OAuth 2.0 User` used by Guarani.
 *
 * The application's User **MUST** implement this interface.
 */
export interface User {
  /**
   * Returns the ID of the User.
   */
  getUserId(): string
}
