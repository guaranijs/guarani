import { Injectable } from '@guarani/ioc'
import {
  JsonWebKey,
  JsonWebSignatureHeader,
  JsonWebTokenClaims,
  SupportedJWSAlgorithm
} from '@guarani/jose'

import { JWTClientAssertion } from '../../client-assertions'
import { SupportedClientAuthentication } from '../../constants'
import { Client } from '../../entities'

/**
 * Implements the Client Authentication via the **JWT Bearer Client Assertion**.
 *
 * If this workflow is enabled, it will look at the Body of the request
 * for a scheme similar to the following:
 *
 * ```rst
 *     client_assertion_type=urn:ietf:params:oauth:
 *     client-assertion-type:jwt-bearer&
 *     client_assertion=eyJhbGciOiJSUzI1NiIsImtpZCI6IjIyIn0.
 *     eyJpc3Mi[...omitted for brevity...].
 *     cC4hiUPo[...omitted for brevity...]
 * ```
 *
 * It will then try to validate the Client Assertion using the
 * **Client's Public Key** based on the **JOSE Header's `kid` parameter**
 * as the JSON Web Key.
 */
@Injectable()
export class PrivateKeyJWT extends JWTClientAssertion {
  /**
   * Name of the Authentication Method.
   */
  public readonly name: SupportedClientAuthentication = 'private_key_jwt'

  /**
   * Supported JSON Web Signature Algorithms of the Client Assertion.
   */
  protected readonly SUPPORTED_JWS_ALGORITHMS: SupportedJWSAlgorithm[] = [
    'ES256',
    'ES384',
    'ES512',
    'PS256',
    'PS384',
    'PS512',
    'RS256',
    'RS384',
    'RS512'
  ]

  /**
   * Retrieves the **JSON Web Key** of the Client and the expected
   * **JSON Web Signature Algorithm** used to sign the Client Assertion.
   *
   * @param client Client of the Request.
   * @param header JOSE Header of the Client Assertion.
   * @param claims JSON Web Token Claims of the Client Assertion.
   * @returns **JSON Web Key** of the Client and the expected
   *     **JSON Web Signature Algorithm** used to sign the Client Assertion.
   */
  protected async getClientKey(
    client: Client,
    header: JsonWebSignatureHeader,
    claims: JsonWebTokenClaims // eslint-disable-line
  ): Promise<JsonWebKey> {
    return await client.getPublicKey(header.kid)
  }
}
