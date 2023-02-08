/**
 * Defines the Options for the Validation of a specific JSON Web Token Claim.
 */
export interface JsonWebTokenClaimValidationOptions {
  /**
   * Defines if the JSON Web Token Claim is Essential.
   *
   * An Essential JSON Web Token Claim **MUST** be provided.
   */
  readonly essential?: boolean;

  /**
   * Defines the specific value that a JSON Web Token Claim is required to have.
   */
  readonly value?: unknown;

  /**
   * Defines the Set of values that the JSON Web Token Claim can assume.
   *
   * For it to be valid, the JSON Web Token Claim **MUST** match **AT LEAST** one of the specified values.
   */
  readonly values?: unknown[];
}
