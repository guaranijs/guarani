import { OneOrMany, Optional } from '@guarani/types';

/**
 * Parameters of the Introspection Response.
 */
export interface IntrospectionResponse {
  /**
   * Indicates if the Token is active.
   */
  readonly active: boolean;

  /**
   * Scope of the Token.
   */
  readonly scope?: Optional<string>;

  /**
   * Identifier of the Client of the Token.
   */
  readonly client_id?: Optional<string>;

  /**
   * Human-readable Identifier of the End User that authorized the Token.
   */
  readonly username?: Optional<string>;

  /**
   * Type of the Token.
   */
  readonly token_type?: Optional<string>;

  /**
   * Expiration date of the Token in UTC seconds.
   */
  readonly exp?: Optional<number>;

  /**
   * Date of issuance of the Token in UTC seconds.
   */
  readonly iat?: Optional<number>;

  /**
   * Date when the Token will become valid in UTC seconds.
   */
  readonly nbf?: Optional<number>;

  /**
   * Identifier of the Subject of the Token.
   */
  readonly sub?: Optional<string>;

  /**
   * Audience to whom the Token was issued.
   */
  readonly aud?: Optional<OneOrMany<string>>;

  /**
   * Identifier of the Authorization Server that issued the Token.
   */
  readonly iss?: Optional<string>;

  /**
   * Identifier of the Token.
   */
  readonly jti?: Optional<string>;

  /**
   * Optional additional parameters.
   */
  [parameter: string]: any;
}
