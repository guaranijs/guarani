import { OutgoingHttpHeaders } from 'http';

import { Injectable, InjectAll } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { TokenContext } from '../context/token/token-context';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedGrantTypeException } from '../exceptions/unsupported-grant-type.exception';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
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
   * @param validators Token Request Validators registered at the Authorization Server.
   */
  public constructor(@InjectAll(TokenRequestValidator) private readonly validators: TokenRequestValidator[]) {}

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
    const parameters = request.body as TokenRequest;

    try {
      const validator = this.getValidator(parameters);

      const context = await validator.validate(request);
      const tokenResponse = await context.grantType.handle(context);

      return new HttpResponse().setHeaders(this.headers).json(removeNullishValues(tokenResponse));
    } catch (exc: unknown) {
      const error =
        exc instanceof OAuth2Exception
          ? exc
          : new ServerErrorException('An unexpected error occurred.', { cause: exc });

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
  private getValidator(parameters: TokenRequest): TokenRequestValidator<TokenRequest, TokenContext<TokenRequest>> {
    if (typeof parameters.grant_type !== 'string') {
      throw new InvalidRequestException('Invalid parameter "grant_type".');
    }

    const validator = this.validators.find((validator) => validator.name === parameters.grant_type);

    if (typeof validator === 'undefined') {
      throw new UnsupportedGrantTypeException(`Unsupported grant_type "${parameters.grant_type}".`);
    }

    return validator;
  }
}
