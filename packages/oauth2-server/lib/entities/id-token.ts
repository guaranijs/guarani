import { OneOrMany, Optional } from '@guarani/types';

import { UserinfoResponse } from '../models/userinfo-response';

/**
 * OpenID Connect ID Token Parameters.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#IDToken
 */
export interface IdToken extends UserinfoResponse {
  /**
   * Identifier of the Issuer of the Token.
   */
  iss: string;

  /**
   * Subject represented by the Token.
   */
  sub: string;

  /**
   * Identifier of the Audience the Token is intended to.
   */
  aud: OneOrMany<string>;

  /**
   * UTC time denoting the Expiration Time of the Token.
   */
  exp: number;

  /**
   * UTC time denoting the moment when the Token was created.
   */
  iat: number;

  /**
   * Time when the End-User was authenticated.
   */
  auth_time?: Optional<number>;

  /**
   * Value provided at the Authentication Request to be passed unmodified to the ID Token.
   */
  nonce?: Optional<string>;

  /**
   * Authentication Context Class Reference value that identifies the Authentication Context Class
   * that the authentication performed satisfied.
   */
  acr?: Optional<string>;

  /**
   * Authentication Methods References.
   */
  amr?: Optional<string[]>;

  /**
   * Authorized party to which the ID Token was issued.
   */
  azp?: Optional<string>;

  /**
   * Base64Url encoding of the left-most half of the hash of the octets of the ASCII **access_token**,
   * where the hash algorithm is the one used in the **alg** JOSE Header Parameter of the ID Token.
   */
  at_hash?: Optional<string>;

  /**
   * Base64Url encoding of the left-most half of the hash of the octets of the ASCII **code**,
   * where the hash algorithm is the one used in the **alg** JOSE Header Parameter of the ID Token.
   */
  c_hash?: Optional<string>;
}
