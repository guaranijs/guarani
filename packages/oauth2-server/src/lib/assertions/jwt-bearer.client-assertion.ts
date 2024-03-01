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
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   */
  public constructor(
    protected readonly logger: Logger,
    @Inject(SETTINGS) protected readonly settings: Settings,
    @Inject(CLIENT_SERVICE) protected readonly clientService: ClientServiceInterface,
  ) {}

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request Http Request.
   */
  public hasBeenRequested(request: HttpRequest): boolean {
    this.logger.debug(`[${this.constructor.name}] Called hasBeenRequested()`, 'e9994da2-7145-424b-bea4-85df04029eee', {
      request,
    });

    const parameters = request.form<JwtBearerClientAssertionParameters>();

    const result =
      parameters.client_assertion_type === this.clientAssertionType &&
      JsonWebSignature.isJsonWebSignature(parameters.client_assertion);

    this.logger.debug(
      `[${this.constructor.name}] Completed hasBeenRequested()`,
      'db2b3573-4737-4231-9521-d0407d838bee',
      { request, result },
    );

    return result;
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request Http Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    this.logger.debug(`[${this.constructor.name}] Called authenticate()`, '973cc193-f980-4286-b24c-84f512e597e8', {
      request,
    });

    const { client_assertion: clientAssertion } = request.form<JwtBearerClientAssertionParameters>();

    try {
      const [header, claims] = await this.getClientAssertionComponents(clientAssertion, request);

      const client = await this.getClient(claims.sub!);

      // TODO: allow the application to validate the claims as it sees fit.

      if (client.authenticationMethod !== this.name) {
        const exc = new InvalidClientException(
          `This Client is not allowed to use the Authentication Method "${this.name}".`,
        );

        this.logger.error(
          `[${this.constructor.name}] The Client is not allowed to use the Authentication Method "${this.name}"`,
          '17b31431-4732-4505-b4ba-7970af4127fc',
          { client },
          exc,
        );

        throw exc;
      }

      if (typeof client.authenticationSigningAlgorithm !== 'string') {
        const exc = new InvalidClientException(
          `This Client is not allowed to use the Authentication Method "${this.name}".`,
        );

        this.logger.error(
          `[${this.constructor.name}] The Client is not allowed to use the Authentication Method "${this.name}"`,
          '29d8875f-cd3e-45b5-a7b6-fd94ca32e807',
          { client },
          exc,
        );

        throw exc;
      }

      if (client.authenticationSigningAlgorithm !== header.alg) {
        const exc = new InvalidClientException(
          `This Client is not allowed to use the Authentication Method "${this.name}".`,
        );

        this.logger.error(
          `[${this.constructor.name}] The Client cannot use the Authentication Signing Algorithm "${header.alg}"`,
          'ab1c3893-3b1a-438d-bae2-5e5d437657ba',
          { client },
          exc,
        );

        throw exc;
      }

      const clientKey = await this.getClientKey(client, header);

      this.logger.debug(
        `[${this.constructor.name}] Attempting to verify the Signature of the JSON Web Token Client Assertion`,
        '4c238787-b699-4c64-9b56-e0d6f7e4af41',
        { client_assertion: clientAssertion },
      );

      await JsonWebSignature.verify(clientAssertion, clientKey, this.algorithms);

      this.logger.debug(`[${this.constructor.name}] Completed authenticate()`, 'c89ad02e-6bbf-42cc-a232-4ec84a835bad', {
        request,
        client,
      });

      return client;
    } catch (exc: unknown) {
      if (exc instanceof OAuth2Exception) {
        throw exc;
      }

      const exception = new InvalidClientException('Invalid JSON Web Token Client Assertion.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid JSON Web Token Client Assertion`,
        'a1aee754-0d3d-4985-ad3c-90e42e840c5d',
        { request },
        exception,
      );

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
  private async getClientAssertionComponents(
    clientAssertion: string,
    request: HttpRequest,
  ): Promise<[JsonWebSignatureHeader, JsonWebTokenClaims]> {
    this.logger.debug(
      `[${this.constructor.name}] Called getClientAssertionComponents()`,
      '88021b9c-3c18-4dbd-b608-1c090e8a465b',
      { client_assertion: clientAssertion, request },
    );

    this.logger.debug(
      `[${this.constructor.name}] Attempting to decode the JSON Web Token Client Assertion`,
      '4de3d83f-d721-4c8f-822f-c2926c858e4a',
      { client_assertion: clientAssertion },
    );

    const { header, payload } = JsonWebSignature.decode(clientAssertion);

    if (header.alg === 'none') {
      const exc = new InvalidClientException(
        'The Authorization Server disallows using the JSON Web Signature Algorithm "none".',
      );

      this.logger.error(
        `[${this.constructor.name}] The Client tried to use the JSON Web Signature Algorithm "none"`,
        '0dc5e319-d161-4a3d-b58d-590750c60236',
        { header },
        exc,
      );

      throw exc;
    }

    if (!this.settings.clientAuthenticationSignatureAlgorithms.includes(header.alg)) {
      const exc = new InvalidClientException(`Unsupported JSON Web Signature Algorithm "${header.alg}".`);

      this.logger.error(
        `[${this.constructor.name}] The Client tried to use the unsupported JSON Web Signature Algorithm "${header.alg}"`,
        'd24fdb8d-461c-4eaa-a7f9-a278fdfc7cd8',
        { header },
        exc,
      );

      throw exc;
    }

    if (!this.algorithms.includes(header.alg)) {
      const exc = new InvalidClientException(
        `Unsupported JSON Web Signature Algorithm "${header.alg}" for Authentication Method "${this.name}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Client tried to use the unsupported JSON Web Signature Algorithm "${header.alg}"`,
        '8db925c7-8bc2-4f24-b2ed-41b4b9221b67',
        { header },
        exc,
      );

      throw exc;
    }

    const { href: idTokenAudience } = new URL(request.path, this.settings.issuer);

    this.logger.debug(
      `[${this.constructor.name}] Attempting to parse the JSON Web Token Client Assertion Payload`,
      'b508a67e-85c5-4dd9-a694-4030a299210f',
      { payload: payload.toString('base64url') },
    );

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
      const exc = new InvalidClientException('The values of "iss" and "sub" are different.');

      this.logger.error(
        `[${this.constructor.name}] The Client tried to use a JSON Web Token Client Assertion with mismatching "iss" and "sub" claims`,
        '0239060b-d05a-417a-94eb-c8ce0579719e',
        { claims },
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getClient()`, '9dd0b29c-8f4f-4fe7-a5db-10d2eaeab3fd', { id });

    this.logger.debug(
      `[${this.constructor.name}] Searching for a Client with the provided Identifier`,
      '4a7a4c34-868d-4b0a-b6c1-25f5bc519130',
      { id },
    );

    const client = await this.clientService.findOne(id);

    if (client === null) {
      const exc = new InvalidClientException('Invalid Client.');

      this.logger.error(
        `[${this.constructor.name}] Could not find a Client with the provided Identifier`,
        '80b344fa-9453-4223-86d4-8372f4df53af',
        { id },
        exc,
      );

      throw exc;
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
