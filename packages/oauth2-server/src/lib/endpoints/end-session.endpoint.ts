import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { URL } from 'url';
import { isDeepStrictEqual } from 'util';

import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { EndSessionContext } from '../context/end-session-context';
import { Client } from '../entities/client.entity';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { Session } from '../entities/session.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { EndSessionRequest } from '../requests/end-session-request';
import { LogoutTicketServiceInterface } from '../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../services/logout-ticket.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { includeAdditionalParameters } from '../utils/include-additional-parameters';
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
   * @param logger Logger of the Authorization Server.
   * @param validator Instance of the End Session Request Validator.
   * @param idTokenHandler Instance of the ID Token Handler.
   * @param settings Settings of the Authorization Server.
   * @param sessionService Instance of the Session Service.
   * @param logoutTicketService Instance of the Logout Ticket Service.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly validator: EndSessionRequestValidator,
    private readonly idTokenHandler: IdTokenHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(LOGOUT_TICKET_SERVICE) private readonly logoutTicketService: LogoutTicketServiceInterface,
  ) {
    if (typeof this.settings.userInteraction === 'undefined') {
      const exc = new TypeError('Missing User Interaction options.');

      this.logger.critical(
        `[${this.constructor.name}] Missing User Interaction options`,
        '189eb4ae-a823-4e92-a74f-2403b00934cd',
        null,
        exc,
      );

      throw exc;
    }

    if (typeof this.settings.postLogoutUrl === 'undefined') {
      const exc = new TypeError('Missing Post Logout Url.');

      this.logger.critical(
        `[${this.constructor.name}] Missing Post Logout Url`,
        '8ac806a9-5623-4bb4-b284-849ae7a3cefc',
        null,
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '7a06bc96-1f86-4a6a-80b8-e5f04d85911b', {
      request,
    });

    const parameters = this.validator.getEndSessionParameters(request);

    let context: EndSessionContext;

    try {
      this.logger.debug(`[${this.constructor.name}] Http Request validation`, 'ba9808e0-2ce6-4066-a56d-cd16c6faad22', {
        request,
      });

      context = await this.validator.validate(request);
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc);

      this.logger.error(
        `[${this.constructor.name}] Error on End Session Endpoint`,
        '510ccdf0-6b47-4a7a-a1f3-3f84c517e643',
        { request },
        error,
      );

      return this.handleFatalEndSessionError(error);
    }

    let logoutTicket: Nullable<LogoutTicket> = null;

    const { client, idTokenHint, postLogoutRedirectUri, state } = context;

    try {
      this.logger.debug(`[${this.constructor.name}] Logout Ticket validation`, 'b46bbf52-302a-4243-b40d-bcb45f449b01', {
        context,
      });

      logoutTicket = await this.findLogoutTicket(context);

      if (logoutTicket !== null) {
        this.checkLogoutTicket(logoutTicket, client, parameters);
      }

      const session = await this.findSession(context);

      if (session !== null && session.activeLogin !== null) {
        this.logger.debug(`[${this.constructor.name}] Found a logged User`, 'e56048f5-f3f3-485d-b0aa-f4f0799bfdb4', {
          context,
          session,
          logout_ticket: logoutTicket,
        });

        if (!(await this.idTokenHandler.checkIdTokenHint(idTokenHint, client, session.activeLogin))) {
          const exc = new InvalidRequestException(
            'The currently authenticated User is not the one expected by the ID Token Hint.',
          );

          this.logger.error(
            `[${this.constructor.name}] The currently authenticated User is not the one expected by the ID Token Hint`,
            '314704b9-3db1-4c4e-b7dc-abba88006551',
            { context, client, logout_ticket: logoutTicket },
            exc,
          );

          throw exc;
        }

        logoutTicket ??= await this.logoutTicketService.create(parameters, client, session);
        return this.redirectToLogoutPage(logoutTicket);
      }

      const url = addParametersToUrl(postLogoutRedirectUri ?? new URL(this.settings.postLogoutUrl!), { state });
      const response = new HttpResponse().redirect(url);

      if (session === null) {
        this.logger.debug(
          `[${this.constructor.name}] No previous Session found`,
          '93ad00c5-81ec-4521-9b05-2b1fd887b322',
          { context, logout_ticket: logoutTicket },
        );

        response.setCookie('guarani:session', null);
      }

      if (logoutTicket !== null) {
        this.logger.debug(
          `[${this.constructor.name}] Removing the Logout Ticket`,
          '0ff9c216-1240-42e7-907a-10b94058ed90',
          { context, logout_ticket: logoutTicket },
        );

        await this.logoutTicketService.remove(logoutTicket);
        response.setCookie('guarani:logout', null);
      }

      this.logger.debug(`[${this.constructor.name}] End Session completed`, '90511c71-9853-436d-bf19-4d101500bd14', {
        response,
      });

      return response;
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc);
      const response = this.handleFatalEndSessionError(error, state);

      this.logger.error(
        `[${this.constructor.name}] Error on End Session Endpoint`,
        'b4452688-de16-4557-9e86-304f42801d53',
        { request },
        error,
      );

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
  private async findSession(context: EndSessionContext): Promise<Nullable<Session>> {
    this.logger.debug(`[${this.constructor.name}] Called findSession()`, 'a4cb3c5f-2e34-4dc1-9304-112b98c69475', {
      context,
    });

    const { cookies } = context;

    if (!Object.hasOwn(cookies, 'guarani:session')) {
      return null;
    }

    const sessionId = cookies['guarani:session'] as string;
    return await this.sessionService.findOne(sessionId);
  }

  /**
   * Searches the application's storage for a Logout Ticket based on the Identifier in the Cookies of the Http Request.
   *
   * @param context End Session Request Context.
   * @returns Logout Ticket based on the Cookies.
   */
  private async findLogoutTicket(context: EndSessionContext): Promise<Nullable<LogoutTicket>> {
    this.logger.debug(`[${this.constructor.name}] Called findLogoutTicket()`, 'aec44b7d-1ed8-4265-bbf1-d7f1fe4067d6', {
      context,
    });

    const { cookies } = context;

    if (!Object.hasOwn(cookies, 'guarani:logout')) {
      return null;
    }

    const logoutTicketId = cookies['guarani:logout'] as string;
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
    this.logger.debug(`[${this.constructor.name}] Called checkLogoutTicket()`, 'f4ea228c-f214-4917-8484-7d919d9b043a', {
      logout_ticket: logoutTicket,
      client,
      parameters,
    });

    const clientId = Buffer.from(client.id, 'utf8');
    const logoutTicketClientId = Buffer.from(logoutTicket.client.id, 'utf8');

    if (clientId.length !== logoutTicketClientId.length || !timingSafeEqual(clientId, logoutTicketClientId)) {
      const exc = new InvalidRequestException('Mismatching Client Identifier.');

      this.logger.error(
        `[${this.constructor.name}] Mismatching Client Identifier`,
        '4abe7bed-86c9-4c0e-b2a6-a780e263d7e0',
        { logout_ticket: logoutTicket, client },
        exc,
      );

      throw exc;
    }

    if (new Date() > logoutTicket.expiresAt) {
      const exc = new InvalidRequestException('Expired Logout Ticket.');

      this.logger.error(
        `[${this.constructor.name}] Expired Logout Ticket`,
        'a330858b-2191-46ba-a431-ff5b13c940aa',
        { logout_ticket: logoutTicket },
        exc,
      );

      throw exc;
    }

    if (!isDeepStrictEqual(parameters, logoutTicket.parameters)) {
      const exc = new InvalidRequestException('One or more parameters changed since the initial request.');

      this.logger.error(
        `[${this.constructor.name}] Expired Logout Ticket`,
        '1fa1da0b-6995-412c-8ea2-fa3331c96fae',
        { logout_ticket: logoutTicket, parameters },
        exc,
      );

      throw exc;
    }
  }

  /**
   * Redirects the User-Agent to the Authorization Server's Logout Page for it to authenticate the User.
   *
   * @param logoutTicket Logout Ticket of the Request.
   * @returns Http Redirect Response to the Logout Page.
   */
  private redirectToLogoutPage(logoutTicket: LogoutTicket): HttpResponse {
    this.logger.debug(
      `[${this.constructor.name}] Called redirectToLogoutPage()`,
      '24710ddc-8eb8-4ad9-b89f-30451a4f6707',
      { logout_ticket: logoutTicket },
    );

    const url = addParametersToUrl(new URL(this.settings.userInteraction!.logoutUrl, this.settings.issuer), {
      logout_challenge: logoutTicket.logoutChallenge,
    });

    return new HttpResponse().setCookie('guarani:logout', logoutTicket.id).redirect(url);
  }

  /**
   * Treats the caught exception into a valid OAuth 2.0 Exception.
   *
   * @param exc Exception caught.
   * @returns Treated OAuth 2.0 Exception.
   */
  private asOAuth2Exception(exc: unknown): OAuth2Exception {
    if (exc instanceof OAuth2Exception) {
      return exc;
    }

    return new ServerErrorException('An unexpected error occurred.', { cause: exc });
  }

  /**
   * Handles a fatal OAuth 2.0 End Session Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Page instead of the Client's Post Logout Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @param state State of the Client prior to the End Session Request.
   * @returns Http Response.
   */
  private handleFatalEndSessionError(error: OAuth2Exception, state: Nullable<string> = null): HttpResponse {
    this.logger.debug(
      `[${this.constructor.name}] Called handleFatalEndSessionError()`,
      '6ab62c88-cdfb-4780-bd1e-b24089df00b6',
      { error, state },
    );

    const response = includeAdditionalParameters(error.toJSON(), { state });
    const url = addParametersToUrl(new URL(this.settings.userInteraction!.errorUrl, this.settings.issuer), response);

    return new HttpResponse().redirect(url.href);
  }
}
