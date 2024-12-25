/**
 * Definition of the options for the **claims** Authorization Request Parameter.
 */
export interface AuthorizationRequestClaimsParameter {
  /**
   * Defines if the Claim is Essential.
   *
   * An Essential Claim **MUST** be provided.
   */
  readonly essential?: boolean;

  /**
   * Defines the specific value that a Claim is required to have.
   */
  readonly value?: unknown;

  /**
   * Defines the Set of values that the Claim can assume.
   *
   * For it to be valid, the Claim **MUST** match **AT LEAST** one of the specified values.
   */
  readonly values?: unknown[];
}
