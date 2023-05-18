import { JsonWebTokenClaimValidationOptions } from './jsonwebtoken-claim-validation.options';

/**
 * Interface of the JSON Web Token Parse Options.
 */
export interface JsonWebTokenClaimsParseOptions {
  /**
   * Options used to validate the claims in a fine-grained manner.
   */
  readonly validationOptions?: Record<string, JsonWebTokenClaimValidationOptions | null>;

  /**
   * Informs if the **exp** claim should be ignored.
   *
   * @default false
   */
  readonly ignoreExpired?: boolean;
}
