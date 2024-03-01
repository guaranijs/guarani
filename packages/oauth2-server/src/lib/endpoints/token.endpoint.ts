import { OutgoingHttpHeaders } from 'http';

import { Injectable, InjectAll } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedGrantTypeException } from '../exceptions/unsupported-grant-type.exception';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { TokenRequest } from '../requests/token/token-request';
import { TokenRequestValidator } from '../validators/token/token-request.validator';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Token** Endpoint.
 *
 * This endpoint is used by the Client to exchange an Authorization Grant for an Access Token
 * that will be used to act on behalf of the Resource Owner.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2
 */
@Injectable()
export class TokenEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'token';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/token';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Token Endpoint.
   *
   * @param logger Logger of the Authorization Server.
   * @param validators Token Request Validators registered at the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
    @InjectAll(TokenRequestValidator) private readonly validators: TokenRequestValidator[],
  ) {}

  /**
   * Creates a Http JSON Access Token Response.
   *
   * This method is responsible for issuing Tokens to Clients that succeed to authenticate
   * within the Authorization Server and have the necessary consent of the Resource Owner.
   *
   * If the Client fails to authenticate within the Authorization Server, does not have the consent
   * of the Resource Owner, or provides invalid or insufficient request parameters,
   * it will receive a **400 Bad Request** Error Response with a JSON object describing the error.
   *
   * If the flow succeeds, the Client will then receive its Token in a JSON object containing the Access Token,
   * the Token Type, the Lifespan of the Access Token, the scopes of the Access Token, and an optional Refresh Token,
   * as well as any optional parameters defined by supplementar specifications.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '89cf77e3-8fb5-424f-be9d-3e52254dc75e', {
      request,
    });

    const parameters = request.form<TokenRequest>();

    try {
      const validator = this.getValidator(parameters);

      const context = await validator.validate(request);
      const tokenResponse = await context.grantType.handle(context);

      const response = new HttpResponse().setHeaders(this.headers).json(removeNullishValues(tokenResponse));

      this.logger.debug(`[${this.constructor.name}] Token completed`, 'a5bccca4-d94d-4b9d-af02-8ccf271a208c', {
        response,
      });

      return response;
    } catch (exc: unknown) {
      const error =
        exc instanceof OAuth2Exception
          ? exc
          : new ServerErrorException('An unexpected error occurred.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Error on Token Endpoint`,
        '2b1a3dfc-ed13-448d-8510-992f4d448a57',
        { request },
        error,
      );

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(removeNullishValues(error.toJSON()));
    }
  }

  /**
   * Retrieves the Token Request Validator based on the Grant Type requested by the Client.
   *
   * @param parameters Parameters of the Token Request.
   * @returns Token Request Validator.
   */
  private getValidator(parameters: TokenRequest): TokenRequestValidator {
    this.logger.debug(`[${this.constructor.name}] Called getValidator()`, 'dd06bae0-16e6-41fe-b432-678ff7d90355', {
      parameters,
    });

    if (typeof parameters.grant_type === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "grant_type".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "grant_type"`,
        '8c9df96c-5d27-4ab8-b484-61e4c6f934c7',
        { parameters },
        exc,
      );

      throw exc;
    }

    const validator = this.validators.find((validator) => validator.name === parameters.grant_type);

    if (typeof validator === 'undefined') {
      const exc = new UnsupportedGrantTypeException(`Unsupported grant_type "${parameters.grant_type}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported grant_type "${parameters.grant_type}"`,
        '00232cfe-e92d-487c-b313-64c1dc2f71cf',
        { parameters },
        exc,
      );

      throw exc;
    }

    return validator;
  }
}
