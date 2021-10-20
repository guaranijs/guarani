import { Injectable } from '@guarani/ioc'
import {
  JsonWebSignatureHeader,
  JsonWebTokenClaims,
  OctKey,
  SupportedJWSAlgorithm
} from '@guarani/jose'

import { JWTClientAssertion } from '../../client-assertions'
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
 * **Client's Secret** as the JSON Web Key.
 */
@Injectable()
export class ClientSecretJWT extends JWTClientAssertion {
  /**
   * Name of the Authentication Method.
   */
  public readonly name: string = 'client_secret_jwt'

  /**
   * Supported JSON Web Signature Algorithms of the Client Assertion.
   */
  protected readonly SUPPORTED_JWS_ALGORITHMS: SupportedJWSAlgorithm[] = [
    'HS256',
    'HS384',
    'HS512'
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
    header: JsonWebSignatureHeader, // eslint-disable-line
    claims: JsonWebTokenClaims // eslint-disable-line
  ): Promise<OctKey> {
    return OctKey.parse(await client.getClientSecret())
  }
}
