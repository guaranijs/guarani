/**
 * Parameters of the OAuth 2.0 Revocation Request.
 */
export interface RevocationRequest extends Record<string, any> {
  /**
   * Token to be revoked.
   */
  readonly token: string;

  /**
   * Optional hint about the type of the Token.
   */
  readonly token_type_hint?: string;
}
