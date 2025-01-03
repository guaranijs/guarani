import { Dictionary } from '@guarani/types';

import { AddressClaimParameters } from './address.claim.parameters';

/**
 * OpenID Connect User Claims.
 */
export interface UserClaimsParameters extends Dictionary<unknown> {
  /**
   * Formatted name of the User.
   */
  name?: string;

  /**
   * Given or First name of the User.
   */
  given_name?: string;

  /**
   * Middle name of the User.
   */
  middle_name?: string;

  /**
   * Family or Last name of the User.
   */
  family_name?: string;

  /**
   * Casual name of the User.
   */
  nickname?: string;

  /**
   * Shorthand name that the User is referred to at the Relying Party.
   */
  preferred_username?: string;

  /**
   * Url of the Profile page of the User.
   */
  profile?: string;

  /**
   * Url of the Picture of the User.
   */
  picture?: string;

  /**
   * Url of the Personal Website or Blog of the User.
   */
  website?: string;

  /**
   * Email address of the User.
   */
  email?: string;

  /**
   * Informs the Relying Party whether or not the Email address of the User has been verified.
   */
  email_verified?: boolean;

  /**
   * Gender of the User.
   */
  gender?: string;

  /**
   * Birthdate of the User in the format **YYYY-MM-DD**.
   */
  birthdate?: string;

  /**
   * Time zone of the User.
   */
  zoneinfo?: string;

  /**
   * Locale of the User, represented as a BCP47 string.
   *
   * @see https://www.rfc-editor.org/rfc/rfc5646.html
   */
  locale?: string;

  /**
   * Phone number of the User, represented as an E.164 string.
   *
   * @see https://www.itu.int/rec/T-REC-E.164-201011-I/en
   */
  phone_number?: string;

  /**
   * Informs the Relying Party whether or not the Phone number of the User has been verified.
   */
  phone_number_verified?: boolean;

  /**
   * Address of the User.
   */
  address?: AddressClaimParameters;

  /**
   * Time the information of the User was last updated, represented as Unix time.
   */
  updated_at?: number;

  /**
   * Defines the Aggregated and Distributed Claims of the End User.
   */
  _claim_names?: Dictionary<string>;

  /**
   * Defines the sources from which the Aggregated and Distributed Claims can be retrieved.
   */
  _claim_sources?: Dictionary<UserAggregatedClaimsParameter | UserDistributedClaimsParameter>;
}

/**
 * Aggregated Claims of the End User.
 */
export interface UserAggregatedClaimsParameter extends Dictionary<unknown> {
  /**
   * JSON Web Token containing the Aggregated Claims of the End User.
   */
  readonly JWT: string;
}

/**
 * Distributed Claims of the End User.
 */
export interface UserDistributedClaimsParameter extends Dictionary<unknown> {
  /**
   * Remote Resource Endpoint from which the Claims can be retrieved.
   * The endpoint URL **MUST** return the Claims as a JSON Web Token.
   */
  readonly endpoint: string;

  /**
   * Access Token used to authorize the Client on the remote Resource Endpoint.
   */
  readonly access_token?: string;
}
