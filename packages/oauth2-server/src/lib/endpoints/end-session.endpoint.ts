import { Inject, Injectable } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { URL, URLSearchParams } from 'url';
import { isDeepStrictEqual } from 'util';

import { EndSessionContext } from '../context/end-session.context';
import { Client } from '../entities/client.entity';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { Session } from '../entities/session.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { EndSessionRequest } from '../requests/end-session-request';
import { LogoutTicketServiceInterface } from '../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../services/logout-ticket.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { EndSessionRequestValidator } from '../validators/end-session-request.validator';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **End Session** Endpoint.
 *
 * This endpoint is used to remove a Login from the Session of the User-Agent.
 *
 * @see https://openid.net/specs/openid-connect-rpinitiated-1_0.html
 */
@Injectable()
export class EndSessionEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'end_session';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/end_session';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['GET', 'POST'];

  /**
   * Instantiates a new End Session Endpoint.
   *
   * @param validator Instance of the End Session Request Validator.
   * @param idTokenHandler Instance of the ID Token Handler.
   * @param settings Settings of the Authorization Server.
   * @param sessionService Instance of the Session Service.
   * @param logoutTicketService Instance of the Logout Ticket Service.
   */
  public constructor(
    private readonly validator: EndSessionRequestValidator,
    private readonly idTokenHandler: IdTokenHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(LOGOUT_TICKET_SERVICE) private readonly logoutTicketService: LogoutTicketServiceInterface
  ) {
    if (typeof this.settings.userInteraction === 'undefined') {
      throw new TypeError('Missing User Interaction options.');
    }

    if (typeof this.settings.postLogoutUrl === 'undefined') {
      throw new TypeError('Missing Post Logout Url.');
    }
  }

  /**
   * Creates a Http Redirect End Session Response.
   *
   * This method is responsible for removing the **Current Active Login** from the User-Agent's Session.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = this.validator.getEndSessionParameters(request);

    let logoutTicket: LogoutTicket | null = null;

    try {
      const context = await this.validator.validate(request);

      const { client, idTokenHint, postLogoutRedirectUri, state } = context;

      logoutTicket = await this.findLogoutTicket(context);

      if (logoutTicket !== null) {
        this.checkLogoutTicket(logoutTicket, client, parameters);
      }

      const session = await this.findSession(context);

      if (session !== null && session.activeLogin != null) {
        if (!(await this.idTokenHandler.checkIdTokenHint(idTokenHint, client, session.activeLogin))) {
          throw new InvalidRequestException({
            description: 'The currently authenticated User is not the one expected by the ID Token Hint.',
            state,
          });
        }

        logoutTicket ??= await this.logoutTicketService.create(parameters, client, session);
        return this.redirectToLogoutPage(logoutTicket);
      }

      const response = new HttpResponse().redirect(postLogoutRedirectUri ?? this.settings.postLogoutUrl!);

      if (session === null) {
        response.setCookie('guarani:session', null);
      }

      if (logoutTicket !== null) {
        await this.logoutTicketService.remove(logoutTicket);
        response.setCookie('guarani:logout', null);
      }

      return response;
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      const response = this.handleFatalEndSessionError(error);

      if (logoutTicket !== null) {
        await this.logoutTicketService.remove(logoutTicket);
        response.setCookie('guarani:logout', null);
      }

      return response;
    }
  }

  /**
   * Searches the application's storage for a Session based on the Identifier in the Cookies of the Http Request.
   *
   * @param context End Session Request Context.
   * @returns Session based on the Cookies.
   */
  private async findSession(context: EndSessionContext): Promise<Session | null> {
    const { cookies } = context;

    const sessionId: string | undefined = cookies['guarani:session'];

    if (sessionId === undefined) {
      return null;
    }

    return await this.sessionService.findOne(sessionId);
  }

  /**
   * Searches the application's storage for a Logout Ticket based on the Identifier in the Cookies of the Http Request.
   *
   * @param context End Session Request Context.
   * @returns Logout Ticket based on the Cookies.
   */
  private async findLogoutTicket(context: EndSessionContext): Promise<LogoutTicket | null> {
    const { cookies } = context;

    const logoutTicketId: string | undefined = cookies['guarani:logout'];

    if (logoutTicketId === undefined) {
      return null;
    }

    return await this.logoutTicketService.findOne(logoutTicketId);
  }

  /**
   * Checks if the provided Logout Ticket is valid.
   *
   * @param logoutTicket Logout Ticket of the Request.
   * @param client Client requesting logout.
   * @param parameters Parameters of the End Session Request.
   */
  private checkLogoutTicket(logoutTicket: LogoutTicket, client: Client, parameters: EndSessionRequest): void {
    const clientId = Buffer.from(client.id, 'utf8');
    const logoutTicketClientId = Buffer.from(logoutTicket.client.id, 'utf8');

    if (clientId.length !== logoutTicketClientId.length || !timingSafeEqual(clientId, logoutTicketClientId)) {
      throw new InvalidRequestException({ description: 'Mismatching Client Identifier.', state: parameters.state });
    }

    if (new Date() > logoutTicket.expiresAt) {
      throw new InvalidRequestException({ description: 'Expired Logout Ticket.', state: parameters.state });
    }

    if (!isDeepStrictEqual(parameters, logoutTicket.parameters)) {
      throw new InvalidRequestException({
        description: 'One or more parameters changed since the initial request.',
        state: parameters.state,
      });
    }
  }

  /**
   * Redirects the User-Agent to the Authorization Server's Logout Page for it to authenticate the User.
   *
   * @param logoutTicket Logout Ticket of the Request.
   * @returns Http Redirect Response to the Logout Page.
   */
  private redirectToLogoutPage(logoutTicket: LogoutTicket): HttpResponse {
    const url = new URL(this.settings.userInteraction!.logoutUrl, this.settings.issuer);
    const parameters = new URLSearchParams({ logout_challenge: logoutTicket.logoutChallenge });

    url.search = parameters.toString();

    return new HttpResponse().setCookie('guarani:logout', logoutTicket.id).redirect(url);
  }

  /**
   * Treats the caught exception into a valid OAuth 2.0 Exception.
   *
   * @param exc Exception caught.
   * @param parameters Parameters of the End Session Request.
   * @returns Treated OAuth 2.0 Exception.
   */
  private asOAuth2Exception(exc: unknown, parameters: EndSessionRequest): OAuth2Exception {
    if (exc instanceof OAuth2Exception) {
      return exc;
    }

    const error = new ServerErrorException({ description: 'An unexpected error occurred.', state: parameters.state });
    error.cause = exc;

    return error;
  }

  /**
   * Handles a fatal OAuth 2.0 End Session Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Page instead of the Client's Post Logout Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @returns Http Response.
   */
  private handleFatalEndSessionError(error: OAuth2Exception): HttpResponse {
    const url = new URL(this.settings.userInteraction!.errorUrl, this.settings.issuer);
    const parameters = new URLSearchParams(error.toJSON());

    url.search = parameters.toString();

    return new HttpResponse().redirect(url.href);
  }
}
