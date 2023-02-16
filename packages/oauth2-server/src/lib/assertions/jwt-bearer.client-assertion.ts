import { Inject, Injectable } from '@guarani/di';
import {
  JsonWebKey,
  JsonWebSignature,
  JsonWebSignatureHeader,
  JsonWebSignatureHeaderParameters,
  JsonWebTokenClaims,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';

import { URL } from 'url';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { ClientAuthenticationInterface } from '../client-authentication/client-authentication.interface';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ClientAssertionParameters } from './client-assertion.parameters';
import { ClientAssertion } from './client-assertion.type';

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
  protected abstract readonly algorithms: JsonWebSignatureAlgorithm[];

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
    @Inject(CLIENT_SERVICE) protected readonly clientService: ClientServiceInterface
  ) {}

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request Http Request.
   */
  public hasBeenRequested(request: HttpRequest): boolean {
    const isValidClientAssertion =
      request.body.client_assertion_type === this.clientAssertionType &&
      typeof request.body.client_assertion === 'string';

    if (!isValidClientAssertion) {
      return false;
    }

    try {
      const [header] = JsonWebSignature.decode(request.body.client_assertion);

      return (
        this.algorithms.includes(header.alg) &&
        this.settings.clientAuthenticationSignatureAlgorithms.includes(header.alg)
      );
    } catch (exc: unknown) {
      const exception = new InvalidClientException({ description: 'Invalid JSON Web Token Client Assertion.' });
      exception.cause = exc;

      throw exception;
    }
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request Http Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    const { client_assertion: clientAssertion } = <ClientAssertionParameters>request.body;

    try {
      const [header, claims] = this.getClientAssertionComponents(clientAssertion, request);

      const client = await this.getClient(claims.sub!);

      // TODO: allow the application to validate the claims as it sees fit.

      if (client.authenticationMethod !== this.name) {
        throw new InvalidClientException({
          description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
        });
      }

      if (client.authenticationSigningAlgorithms?.includes(header.alg) !== true) {
        throw new InvalidClientException({
          description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
        });
      }

      const clientKey = await this.getClientKey(client, header);

      await JsonWebSignature.verify(clientAssertion, clientKey, this.algorithms);

      return client;
    } catch (exc: unknown) {
      if (exc instanceof OAuth2Exception) {
        throw exc;
      }

      const exception = new InvalidClientException({ description: 'Invalid JSON Web Token Client Assertion.' });
      exception.cause = exc;

      throw exception;
    }
  }

  /**
   * Extracts, validates and returns the JSON Web Signature Header and JSON Web Token Claims of the Client Assertion.
   *
   * @param clientAssertion JSON Web Token Client Assertion provided by the Client.
   * @param request Http Request.
   * @returns 2-tuple with the JSON Web Signature Header and the JSON Web Token Claims of the Client Assertion.
   */
  private getClientAssertionComponents(
    clientAssertion: string,
    request: HttpRequest
  ): [JsonWebSignatureHeader, JsonWebTokenClaims] {
    const [header, payload] = JsonWebSignature.decode(clientAssertion);

    if (header.alg === 'none') {
      throw new InvalidClientException({ description: 'Invalid JSON Web Signature Algorithm "none".' });
    }

    const claims = new JsonWebTokenClaims(JSON.parse(payload.toString('utf8')), {
      iss: { essential: true },
      sub: { essential: true },
      aud: { essential: true, value: new URL(request.path, this.settings.issuer).href },
      exp: { essential: true },
      jti: { essential: true },
    });

    if (claims.iss !== claims.sub) {
      throw new InvalidClientException({ description: 'The values of "iss" and "sub" are different.' });
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
      throw new InvalidClientException({ description: 'Invalid Client.' });
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
