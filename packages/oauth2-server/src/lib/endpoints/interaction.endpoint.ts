import { OutgoingHttpHeaders } from 'http';

import { Injectable, InjectAll } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedInteractionTypeException } from '../exceptions/unsupported-interaction-type.exception';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { InteractionRequest } from '../requests/interaction/interaction-request';
import { InteractionRequestValidator } from '../validators/interaction/interaction-request.validator';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the custom **Interaction** Endpoint.
 *
 * This endpoint is used by the application to fetch the context of, or to inform the decision of a User Interaction.
 *
 * Since there is no standard OAuth 2.0 specification regarding the Interactions with an End User,
 * this package implements a custom protocol for them.
 *
 * Further instructions on each Interaction should be consulted at the respective Interaction Type's documentation.
 */
@Injectable()
export class InteractionEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'interaction';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/interaction';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['GET', 'POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Interaction Endpoint.
   *
   * @param validators Interaction Request Validators registered at the Authorization Server.
   */
  public constructor(
    @InjectAll(InteractionRequestValidator) private readonly validators: InteractionRequestValidator[]
  ) {}

  /**
   * Creates an Http JSON Interaction Response.
   *
   * This method is a dispatcher for either the Interaction Context Request or the Interaction Decision Request,
   * represented by the Http Methods GET and POST, respectively.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      switch (request.method) {
        case 'GET':
          return await this.handleContext(request);

        case 'POST':
          return await this.handleDecision(request);

        default:
          throw new TypeError(`Unsupported Http Method "${request.method}" for Interaction Endpoint.`);
      }
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
   * Handles the Context Flow of the Interaction.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  private async handleContext(request: HttpRequest): Promise<HttpResponse> {
    const parameters = request.query as InteractionRequest;

    const validator = this.getValidator(parameters);

    const context = await validator.validateContext(request);
    const interactionResponse = await context.interactionType.handleContext(context);

    return new HttpResponse().setHeaders(this.headers).json(removeNullishValues(interactionResponse));
  }

  /**
   * Handles the Decision Flow of the Interaction.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  private async handleDecision(request: HttpRequest): Promise<HttpResponse> {
    const parameters = request.form<InteractionRequest>();

    const validator = this.getValidator(parameters);

    const context = await validator.validateDecision(request);
    const interactionResponse = await context.interactionType.handleDecision(context);

    return new HttpResponse().setHeaders(this.headers).json(removeNullishValues(interactionResponse));
  }

  /**
   * Retrieves the Interaction Request Validator based on the Interaction Type requested by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Interaction Request Validator.
   */
  private getValidator(parameters: InteractionRequest): InteractionRequestValidator {
    if (typeof parameters.interaction_type === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "interaction_type".');
    }

    const validator = this.validators.find((validator) => validator.name === parameters.interaction_type);

    if (typeof validator === 'undefined') {
      throw new UnsupportedInteractionTypeException(`Unsupported interaction_type "${parameters.interaction_type}".`);
    }

    return validator;
  }
}
