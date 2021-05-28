import { OAuth2Request } from '../context'
import { OAuth2Client } from '../models'

/**
 * Base class for handling Client Authentication on an arbitrary endpoint.
 *
 * Guarani implements the default authentication methods described by the
 * `token_endpoint_auth_method` metadata specified at
 * {@link https://tools.ietf.org/html/rfc7591#section-2|RFC 7591},
 * and methods from the other extending specifications.
 *
 * This class defines the signature of the Client Authentication Methods
 * registered within Guarani. It exposes the abstract method `authenticate`,
 * which is used to perform the verification of the requesting Client based
 * on its flow.
 */
export interface ClientAuthentication {
  /**
   * Name of the Authentication Method.
   */
  readonly name: string

  /**
   * Entry point of the Method's Client Authentication Flow.
   *
   * This method is invoked by the authentication manager.
   * It extracts the necessary data from the Request and tries to locate
   * a Client based on it.
   *
   * If it fails to extract the necessary data, it will return `undefined`,
   * since it was not meant to be used.
   *
   * If it finds the necessary data to perform its flow, but fails to locate
   * a Client, or if the Client fails the validation of the Method, then it
   * will throw an `InvalidClient` error.
   *
   * If everything works as expected, it will return the authenticated Client.
   *
   * @param request - Current request.
   * @throws {InvalidClient} A Client was not found or it failed the validation.
   * @returns Authenticated Client.
   */
  authenticate(request: OAuth2Request): Promise<OAuth2Client>
}
