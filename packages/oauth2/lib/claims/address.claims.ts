/**
 * Defines the structure of the End-User's preferred postal address.
 */
export interface AddressClaims {
  /**
   * Full mailing address, formatted for display or use on a mailing label.
   */
  formatted?: string

  /**
   * Full street address component.
   */
  street_address?: string

  /**
   * City or locality component.
   */
  locality?: string

  /**
   * State, province, prefecture or region component.
   */
  region?: string

  /**
   * Zip code or postal code component.
   */
  postal_code?: string

  /**
   * Country name component.
   */
  country?: string
}
