import { AddressClaims } from './address.claims'

/**
 * Defines the standard claims about the End-User.
 */
export interface UserinfoClaims {
  /**
   * Subject Identifier of the End-User at the Issuer.
   */
  readonly sub: string

  /**
   * Full name of the End-User.
   */
  name?: string

  /**
   * Given name or first name of the End-User.
   */
  given_name?: string

  /**
   * Surname or last name of the End-User.
   */
  family_name?: string

  /**
   * Middle name of the End-User.
   */
  middle_name?: string

  /**
   * Casual name of the End-User.
   */
  nickname?: string

  /**
   * Shorthand name of the End-User at the Relying Party.
   */
  preferred_username?: string

  /**
   * URL of the End-User's profile page.
   */
  profile?: string

  /**
   * URL of the End-User's profile picture
   */
  picture?: string

  /**
   * URL of the End-User's Web Page or Blog.
   */
  website?: string

  /**
   * Email address of the End-User.
   */
  email?: string

  /**
   * Verification status of the End-User's email address.
   */
  email_verified?: boolean

  /**
   * Gender of the End-User.
   */
  gender?: string

  /**
   * Birthdate of the End-User in the format **YYYY-MM-DD**.
   */
  birthdate?: string

  /**
   * Timezone of the End-User.
   */
  zoneinfo?: string

  /**
   * End-User's locale, represented as a BCP47 [RFC5646] language tag.
   */
  locale?: string

  /**
   * Phone number of the End-User.
   */
  phone_number?: string

  /**
   * Verification status of the End-User's phone number.
   */
  phone_number_verified?: boolean

  /**
   * Preferred postal address of the End-User.
   */
  address?: AddressClaims

  /**
   * Time the End-User's information was last updated.
   */
  updated_at?: number

  /**
   * Optional additional claims.
   */
  [claim: string]: any
}
