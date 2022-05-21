import { Dict, Optional } from '@guarani/types';

/**
 * Parameters of the OpenID Connect Userinfo Response.
 */
export interface UserinfoResponse extends Dict {
  /**
   * Identifier of the End-User.
   */
  readonly sub: string;

  /**
   * Formatted name of the End-User.
   */
  name?: Optional<string>;

  /**
   * Given or first name of the End-User.
   */
  given_name?: Optional<string>;

  /**
   * Family or last name of the End-User.
   */
  family_name?: Optional<string>;

  /**
   * Middle name of the End-User.
   */
  middle_name?: Optional<string>;

  /**
   * Casual name of the End-User.
   */
  nickname?: Optional<string>;

  /**
   * Shorthand name by which the End-User wishes to be referred to at the Relying Party.
   */
  preferred_username?: Optional<string>;

  /**
   * URL of the End-User's profile page.
   */
  profile?: Optional<string>;

  /**
   * URL of the End-User's profile picture.
   */
  picture?: Optional<string>;

  /**
   * URL of the End-User's Web page or blog.
   */
  website?: Optional<string>;

  /**
   * Email address of the End-User.
   */
  email?: Optional<string>;

  /**
   * Verification status of the End-User's email.
   */
  email_verified?: Optional<boolean>;

  /**
   * Gender of the End-User.
   */
  gender?: Optional<string>;

  /**
   * Birthdate of the End-User in the format `YYYY-MM-DD`.
   */
  birthdate?: Optional<string>;

  /**
   * String from the timezone database representing the timezone of the End-User.
   */
  zoneinfo?: Optional<string>;

  /**
   * BCP47 [RFC5646] language tag of the End-User.
   */
  locale?: Optional<string>;

  /**
   * Phone number of the End-User.
   */
  phone_number?: Optional<string>;

  /**
   * Verification status of the End-User's phone number.
   */
  phone_number_verified?: Optional<boolean>;

  /**
   * Postal address of the End-User.
   */
  address?: {
    /**
     * Full mailing address as it would appear on a mailing label.
     */
    formatted?: Optional<string>;

    /**
     * Full street address component of the address, containing any extension identifier.
     */
    street_address?: Optional<string>;

    /**
     * City or locality component of the address.
     */
    locality?: Optional<string>;

    /**
     * State, province, prefecture, or region component of the address.
     */
    region?: Optional<string>;

    /**
     * Zip code or postal code component of the address.
     */
    postal_code?: Optional<string>;

    /**
     * Country name component of the address.
     */
    country?: Optional<string>;
  };

  /**
   * Date when the End-User's information was last updated.
   */
  updated_at?: Optional<number>;
}
