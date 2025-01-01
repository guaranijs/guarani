import { Dictionary, Nullable } from '@guarani/types';

/**
 * Definition of the **claims** Authorization Request Parameter.
 */
export interface AuthorizationRequestClaimsParameter
  extends Dictionary<AuthorizationRequestClaimsParameterIndividualClaim> {
  /**
   * Defines the set of user claims to be returned at the Userinfo Endpoint.
   */
  readonly userinfo?: AuthorizationRequestClaimsParameterIndividualClaim;

  /**
   * Defines the set of user claims to be returned in the ID Token.
   */
  readonly id_token?: AuthorizationRequestClaimsParameterIndividualClaim;
}

/**
 * Definition of an individual claim of the **claims** Authorization Request Parameter.
 */
export type AuthorizationRequestClaimsParameterIndividualClaim = Dictionary<
  Nullable<AuthorizationRequestClaimsParameterOptions>
>;

/**
 * Definition of the options for an individual claim of the **claims** Authorization Request Parameter.
 */
export interface AuthorizationRequestClaimsParameterOptions extends Dictionary<unknown> {
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
