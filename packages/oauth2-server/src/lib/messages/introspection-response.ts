/**
 * Parameters of the OAuth 2.0 Introspection Response.
 */
export interface IntrospectionResponse extends Record<string, any> {
  /**
   * Indicates if the Token is active.
   */
  readonly active: boolean;

  /**
   * Scope of the Token.
   */
  readonly scope?: string;

  /**
   * Identifier of the Client of the Token.
   */
  readonly client_id?: string;

  /**
   * Human-readable Identifier of the End User that authorized the Token.
   */
  readonly username?: string;

  /**
   * Type of the Token.
   */
  readonly token_type?: string;

  /**
   * Expiration date of the Token in UTC seconds.
   */
  readonly exp?: number;

  /**
   * Date of issuance of the Token in UTC seconds.
   */
  readonly iat?: number;

  /**
   * Date when the Token will become valid in UTC seconds.
   */
  readonly nbf?: number;

  /**
   * Identifier of the Subject of the Token.
   */
  readonly sub?: string;

  /**
   * Audience to whom the Token was issued.
   */
  readonly aud?: string | string[];

  /**
   * Identifier of the Authorization Server that issued the Token.
   */
  readonly iss?: string;

  /**
   * Identifier of the Token.
   */
  readonly jti?: string;
}
