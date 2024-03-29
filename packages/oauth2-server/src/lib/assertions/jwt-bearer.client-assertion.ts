import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';
import {
  JsonWebKey,
  JsonWebSignature,
  JsonWebSignatureAlgorithm,
  JsonWebSignatureHeader,
  JsonWebSignatureHeaderParameters,
  JsonWebTokenClaims,
} from '@guarani/jose';

import { ClientAuthenticationInterface } from '../client-authentication/client-authentication.interface';
import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ClientAssertion } from './client-assertion.type';
import { JwtBearerClientAssertionParameters } from './jwt-bearer.client-assertion.parameters';

/**
 * Implementation of the JWT Bearer Client Assertion as described in RFC 7523.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7523.html
 */
@Injectable()
export abstract class JwtBearerClientAssertion implements ClientAuthenticationInterface {
  /**
   * JSON Web Signature Algorithms.
   */
  protected abstract readonly algorithms: Exclude<JsonWebSignatureAlgorithm, 'none'>[];

  /**
   * Name of the Client Authentication Method.
   */
  public abstract readonly name: ClientAuthentication;

  /**
   * Name of the Client Assertion Type.
   */
  public readonly clientAssertionType: ClientAssertion = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';

  /**
   * Instantiates a new JWT Bearer Client Authentication Method.
   *
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   */
  public constructor(
    @Inject(SETTINGS) protected readonly settings: Settings,
    @Inject(CLIENT_SERVICE) protected readonly clientService: ClientServiceInterface,
  ) {}

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request Http Request.
   */
  public hasBeenRequested(request: HttpRequest): boolean {
    const parameters = request.form<JwtBearerClientAssertionParameters>();

    return (
      parameters.client_assertion_type === this.clientAssertionType &&
      JsonWebSignature.isJsonWebSignature(parameters.client_assertion)
    );
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request Http Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    const { client_assertion: clientAssertion } = request.form<JwtBearerClientAssertionParameters>();

    try {
      const [header, claims] = await this.getClientAssertionComponents(clientAssertion, request);

      const client = await this.getClient(claims.sub!);

      // TODO: allow the application to validate the claims as it sees fit.

      if (client.authenticationMethod !== this.name) {
        throw new InvalidClientException(`This Client is not allowed to use the Authentication Method "${this.name}".`);
      }

      if (typeof client.authenticationSigningAlgorithm !== 'string') {
        throw new InvalidClientException(`This Client is not allowed to use the Authentication Method "${this.name}".`);
      }

      if (client.authenticationSigningAlgorithm !== header.alg) {
        throw new InvalidClientException(`This Client is not allowed to use the Authentication Method "${this.name}".`);
      }

      const clientKey = await this.getClientKey(client, header);

      await JsonWebSignature.verify(clientAssertion, clientKey, this.algorithms);

      return client;
    } catch (exc: unknown) {
      throw exc instanceof OAuth2Exception
        ? exc
        : new InvalidClientException('Invalid JSON Web Token Client Assertion.', { cause: exc });
    }
  }

  /**
   * Extracts, validates and returns the JSON Web Signature Header and JSON Web Token Claims of the Client Assertion.
   *
   * @param clientAssertion JSON Web Token Client Assertion provided by the Client.
   * @param request Http Request.
   * @returns 2-tuple with the JSON Web Signature Header and the JSON Web Token Claims of the Client Assertion.
   */
  private async getClientAssertionComponents(
    clientAssertion: string,
    request: HttpRequest,
  ): Promise<[JsonWebSignatureHeader, JsonWebTokenClaims]> {
    const { header, payload } = JsonWebSignature.decode(clientAssertion);

    if (header.alg === 'none') {
      throw new InvalidClientException(
        'The Authorization Server disallows using the JSON Web Signature Algorithm "none".',
      );
    }

    if (!this.settings.clientAuthenticationSignatureAlgorithms.includes(header.alg)) {
      throw new InvalidClientException(`Unsupported JSON Web Signature Algorithm "${header.alg}".`);
    }

    if (!this.algorithms.includes(header.alg)) {
      throw new InvalidClientException(
        `Unsupported JSON Web Signature Algorithm "${header.alg}" for Authentication Method "${this.name}".`,
      );
    }

    const { href: idTokenAudience } = new URL(request.path, this.settings.issuer);

    const claims = await JsonWebTokenClaims.parse(payload, {
      validationOptions: {
        iss: { essential: true },
        sub: { essential: true },
        aud: { essential: true, values: [idTokenAudience, [idTokenAudience]] },
        exp: { essential: true },
        jti: { essential: true },
      },
    });

    if (claims.iss !== claims.sub) {
      throw new InvalidClientException('The values of "iss" and "sub" are different.');
    }

    return [header, claims];
  }

  /**
   * Fetches the Client of the Client Assertion from the application's storage.
   *
   * @param id Identifier of the Client that issued the Client Assertion.
   * @returns Client of the Client Assertion.
   */
  private async getClient(id: string): Promise<Client> {
    const client = await this.clientService.findOne(id);

    if (client === null) {
      throw new InvalidClientException('Invalid Client.');
    }

    return client;
  }

  /**
   * Returns the JSON Web Key of the Client used to validate the Client Assertion.
   *
   * @param client Client of the Request.
   * @param header JSON Web Signature Header of the Client Assertion.
   * @returns JSON Web Key of the Client based on the JSON Web Signature Header.
   */
  protected abstract getClientKey(client: Client, header: JsonWebSignatureHeaderParameters): Promise<JsonWebKey>;
}
