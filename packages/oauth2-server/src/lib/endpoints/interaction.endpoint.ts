import { Injectable, InjectAll } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedInteractionTypeException } from '../exceptions/unsupported-interaction-type.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { InteractionTypeInterface } from '../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../interaction-types/interaction-type.token';
import { InteractionType } from '../interaction-types/interaction-type.type';
import { InteractionRequest } from '../messages/interaction-request';
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
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(@InjectAll(INTERACTION_TYPE) private readonly interactionTypes: InteractionTypeInterface[]) {}

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
      let error: OAuth2Exception;

      if (exc instanceof OAuth2Exception) {
        error = exc;
      } else {
        error = new ServerErrorException({ description: 'An unexpected error occurred.' });
        error.cause = exc;
      }

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(error.toJSON());
    }
  }

  /**
   * Handles the Context Flow of the Interaction.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  private async handleContext(request: HttpRequest): Promise<HttpResponse> {
    const parameters = <InteractionRequest>request.query;

    this.checkParameters(parameters);

    const interactionType = this.getInteractionType(parameters.interaction_type);
    const interactionResponse = await interactionType.handleContext(parameters);

    return new HttpResponse().setHeaders(this.headers).json(interactionResponse);
  }

  /**
   * Handles the Decision Flow of the Interaction.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  private async handleDecision(request: HttpRequest): Promise<HttpResponse> {
    const parameters = <InteractionRequest>request.body;

    this.checkParameters(parameters);

    const interactionType = this.getInteractionType(parameters.interaction_type);
    const interactionResponse = await interactionType.handleDecision(parameters);

    return new HttpResponse().setHeaders(this.headers).json(interactionResponse);
  }

  /**
   * Checks if the Parameters of the Interaction Request are valid.
   *
   * @param parameters Parameters of the Interaction Request.
   */
  private checkParameters(parameters: InteractionRequest): void {
    const { interaction_type: interactionType } = parameters;

    if (typeof interactionType !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "interaction_type".' });
    }
  }

  /**
   * Retrieves the Interaction Type based on the **interaction_type** requested by the Client.
   *
   * @param name Interaction Type requested by the Client.
   * @returns Interaction Type.
   */
  private getInteractionType(name: InteractionType): InteractionTypeInterface {
    const interactionType = this.interactionTypes.find((interactionType) => interactionType.name === name);

    if (interactionType === undefined) {
      throw new UnsupportedInteractionTypeException({ description: `Unsupported interaction_type "${name}".` });
    }

    return interactionType;
  }
}
