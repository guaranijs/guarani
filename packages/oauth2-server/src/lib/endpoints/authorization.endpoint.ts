import { Inject, Injectable, InjectAll } from '@guarani/di';

import { URL, URLSearchParams } from 'url';

import { AuthorizationContext } from '../context/authorization/authorization.context';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { InteractionHandler } from '../handlers/interaction.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ResponseType } from '../response-types/response-type.type';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { AuthorizationRequestValidator } from '../validators/authorization/authorization-request.validator';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Authorization** Endpoint.
 *
 * This endpoint is used to provide an Authorization Grant for the requesting Client on behalf of the End User.
 *
 * Since the OAuth 2.0 Spec does not define the need for authentication when using this endpoint, it is left omitted.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1
 */
@Injectable()
export class AuthorizationEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'authorization';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/authorize';

  /**
   * Http methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['GET'];

  /**
   * Instantiates a new Authorization Endpoint.
   *
   * @param interactionHandler Instance of the Interaction Handler.
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param validators Authorization Request Validators registered at the Authorization Server.
   */
  public constructor(
    private readonly interactionHandler: InteractionHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @InjectAll(AuthorizationRequestValidator)
    private readonly validators: AuthorizationRequestValidator<
      AuthorizationRequest,
      AuthorizationContext<AuthorizationRequest>
    >[]
  ) {
    if (this.settings.userInteraction === undefined) {
      throw new TypeError('Missing User Interaction options.');
    }
  }

  /**
   * Creates a Http Redirect Authorization Response.
   *
   * Any error is safely redirected to the Redirect URI provided by the Client in the Authorization Request,
   * or to the Authorization Server's Error Endpoint, should the error not be returned to the Client's Redirect URI.
   *
   * If the authorization flow of the grant results in a successful response, it will redirect the User-Agent
   * to the Redirect URI provided by the Client.
   *
   * This method **REQUIRES** consent given by the User, be it implicit or explicit.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = <AuthorizationRequest>request.query;

    let context: AuthorizationContext<AuthorizationRequest>;

    try {
      const validator = this.getValidator(parameters);
      context = await validator.validate(request);
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      return this.handleFatalAuthorizationError(error);
    }

    const entitiesOrInteractionResponse = await this.interactionHandler.getEntitiesOrHttpResponse(context);

    if (entitiesOrInteractionResponse instanceof HttpResponse) {
      return entitiesOrInteractionResponse;
    }

    const [grant, session, consent] = entitiesOrInteractionResponse;

    try {
      const authorizationResponse = await context.responseType.handle(context, session, consent);

      if (this.settings.enableAuthorizationResponseIssuerIdentifier) {
        authorizationResponse.iss = this.settings.issuer;
      }

      if (grant !== null) {
        await this.grantService.remove(grant);
      }

      return context.responseMode.createHttpResponse(parameters.redirect_uri, authorizationResponse).setCookies({
        'guarani:grant': null,
        'guarani:session': session.id,
      });
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      return context.responseMode.createHttpResponse(parameters.redirect_uri, error.toJSON());
    }
  }

  /**
   * Retrieves the Authorization Request Validator based on the Response Type requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Authorization Request Validator.
   */
  private getValidator(
    parameters: AuthorizationRequest
  ): AuthorizationRequestValidator<AuthorizationRequest, AuthorizationContext<AuthorizationRequest>> {
    if (typeof parameters.response_type !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "response_type".' });
    }

    const responseTypeName = <ResponseType>parameters.response_type.split(' ').sort().join(' ');
    const validator = this.validators.find((validator) => validator.name === responseTypeName);

    if (validator === undefined) {
      throw new InvalidRequestException({ description: `Unsupported response_type "${responseTypeName}".` });
    }

    return validator;
  }

  /**
   * Handles a fatal OAuth 2.0 Authorization Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Page instead of the Client's Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @returns Http Response.
   */
  private handleFatalAuthorizationError(error: OAuth2Exception): HttpResponse {
    const { issuer, userInteraction } = this.settings;

    const url = new URL(userInteraction!.errorUrl, issuer);
    const parameters = new URLSearchParams(error.toJSON());

    url.search = parameters.toString();

    return new HttpResponse().redirect(url.href);
  }

  /**
   * Treats the caught exception into a valid OAuth 2.0 Exception.
   *
   * @param exc Exception caught.
   * @param parameters Parameters of the Authorization Request.
   * @returns Treated OAuth 2.0 Exception.
   */
  private asOAuth2Exception(exc: unknown, parameters: AuthorizationRequest): OAuth2Exception {
    let error: OAuth2Exception;

    if (exc instanceof OAuth2Exception) {
      error = exc;
    } else {
      error = new ServerErrorException({ description: 'An unexpected error occurred.', state: parameters.state });
      error.cause = exc;
    }

    if (this.settings.enableAuthorizationResponseIssuerIdentifier) {
      error.setParameter('iss', this.settings.issuer);
    }

    return error;
  }
}
