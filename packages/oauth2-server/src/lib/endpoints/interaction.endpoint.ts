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
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param validators Interaction Request Validators registered at the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
    @InjectAll(InteractionRequestValidator) private readonly validators: InteractionRequestValidator[],
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
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '51100321-3412-481a-9d70-b74937f4f1dd', {
      request,
    });

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

      this.logger.error(
        `[${this.constructor.name}] Error on Interaction Endpoint`,
        '73365dc0-8427-43d2-a770-65185bfac56b',
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
   * Handles the Context Flow of the Interaction.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  private async handleContext(request: HttpRequest): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleContext()`, 'd17d4df9-8661-4090-87ef-1d828cde47db', {
      request,
    });

    const parameters = request.query as InteractionRequest;

    const validator = this.getValidator(parameters);

    const context = await validator.validateContext(request);
    const interactionResponse = await context.interactionType.handleContext(context);

    const response = new HttpResponse().setHeaders(this.headers).json(removeNullishValues(interactionResponse));

    this.logger.debug(`[${this.constructor.name}] Interaction completed`, '7b6ec1ac-66a4-4b7d-a6bb-274a8939710f', {
      response,
    });

    return response;
  }

  /**
   * Handles the Decision Flow of the Interaction.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  private async handleDecision(request: HttpRequest): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleDecision()`, '599336c2-45bd-4655-9a47-c69657e801a1', {
      request,
    });

    const parameters = request.form<InteractionRequest>();

    const validator = this.getValidator(parameters);

    const context = await validator.validateDecision(request);
    const interactionResponse = await context.interactionType.handleDecision(context);

    const response = new HttpResponse().setHeaders(this.headers).json(removeNullishValues(interactionResponse));

    this.logger.debug(`[${this.constructor.name}] Interaction completed`, '79c688f3-f1f7-4315-907e-55719d3c9270', {
      response,
    });

    return response;
  }

  /**
   * Retrieves the Interaction Request Validator based on the Interaction Type requested by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Interaction Request Validator.
   */
  private getValidator(parameters: InteractionRequest): InteractionRequestValidator {
    this.logger.debug(`[${this.constructor.name}] Called getValidator()`, 'bcc58f23-ef8b-4cd7-a64a-ff36358a7aac', {
      parameters,
    });

    if (typeof parameters.interaction_type === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "interaction_type".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "interaction_type"`,
        'e86743b6-fb58-489f-b489-e8eedaeb2fd4',
        { parameters },
        exc,
      );

      throw exc;
    }

    const validator = this.validators.find((validator) => validator.name === parameters.interaction_type);

    if (typeof validator === 'undefined') {
      const exc = new UnsupportedInteractionTypeException(
        `Unsupported interaction_type "${parameters.interaction_type}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported interaction_type "${parameters.interaction_type}"`,
        '09e45b3f-5508-4cc9-a5c7-fe1c7734962c',
        { parameters },
        exc,
      );

      throw exc;
    }

    return validator;
  }
}
