import { Scope } from './scope'

export class Claim extends Scope {
  public static readonly openid = new Claim(
    'openid',
    "Grants read-only permission to the authenticated user's ID.",
    new Set(['sub'])
  )

  public static readonly profile = new Claim(
    'profile',
    "Grants read-only permission to the authenticated user's profile.",
    new Set([
      'name',
      'family_name',
      'middle_name',
      'given_name',
      'nickname',
      'preferred_username',
      'profile',
      'picture',
      'website',
      'gender',
      'birthdate',
      'zoneinfo',
      'locale',
      'updated_at'
    ])
  )

  public static readonly email = new Claim(
    'email',
    "Grants read-only permission to the authenticated user's email.",
    new Set(['email', 'email_verified'])
  )

  public static readonly phone = new Claim(
    'phone',
    "Grants read-only permission to the authenticated user's phone number.",
    new Set(['phone_number', 'phone_number_verified'])
  )

  public static readonly address = new Claim(
    'address',
    "Grants read-only permission to the authenticated user's address.",
    new Set(['address'])
  )

  public readonly claims: Iterable<string>

  public constructor(name: string, claims: Iterable<string>)

  public constructor(
    name: string,
    description: string,
    claims: Iterable<string>
  )

  public constructor(
    name: string,
    claimsOrDescription: Iterable<string> | string,
    claims?: Iterable<string>
  ) {
    if (typeof claimsOrDescription === 'string') {
      if (!claims) throw new TypeError('Invalid parameter "claims".')
      super(name, claimsOrDescription)
      this.claims = claims
    } else {
      super(name)
      this.claims = claimsOrDescription
    }
  }

  public toString(): string {
    return this.name
  }
}
