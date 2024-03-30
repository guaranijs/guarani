import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { EndSessionContext } from '../context/end-session-context';
import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { EndSessionRequest } from '../requests/end-session-request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';

/**
 * Implementation of the End Session Request Validator.
 */
@Injectable()
export class EndSessionRequestValidator {
  /**
   * Instantiates a new End Session Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface,
  ) {}

  /**
   * Validates the Http End Session Request and returns the actors of the End Session Context.
   *
   * @param request Http Request.
   * @returns End Session Context.
   */
  public async validate(request: HttpRequest): Promise<EndSessionContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '9d651797-4a53-48f7-a068-8d5f9930c0ba', {
      request,
    });

    const parameters = this.getEndSessionParameters(request);
    const cookies = request.cookies;

    const idTokenHint = this.getIdTokenHint(parameters);
    const client = await this.getClient(parameters);
    const postLogoutRedirectUri = this.getPostLogoutRedirectUri(parameters, client);
    const state = this.getState(parameters);
    const logoutHint = this.getLogoutHint(parameters);
    const uiLocales = this.getUiLocales(parameters);

    const context: EndSessionContext = {
      parameters,
      cookies,
      idTokenHint,
      client,
      postLogoutRedirectUri,
      state,
      logoutHint,
      uiLocales,
    };

    this.logger.debug(
      `[${this.constructor.name}] End Session Request validation completed`,
      '9ac5e98d-7f8b-4da4-aa77-4f5e0d39ee14',
      { context },
    );

    return context;
  }

  /**
   * Extracts the Parameters of the End Session Request based on the Http Method.
   *
   * @param request Http Request.
   * @returns Parameters of the End Session Request.
   */
  public getEndSessionParameters(request: HttpRequest): EndSessionRequest {
    this.logger.debug(
      `[${this.constructor.name}] Called getEndSessionParameters()`,
      '128b05a6-2e16-430b-81cb-a8d5be101d93',
      { request },
    );

    switch (request.method) {
      case 'GET':
        return request.query as EndSessionRequest;

      case 'POST':
        return request.form<EndSessionRequest>();

      default: {
        const exc = new TypeError(`Unsupported Http Method "${request.method}".`);

        this.logger.critical(
          `[${this.constructor.name}] Unsupported Http Method "${request.method}"`,
          'e2fed559-3e23-4f75-80cd-d617ed1ae44b',
          { method: request.method },
          exc,
        );

        throw exc;
      }
    }
  }

  /**
   * Checks and returns the ID Token Hint provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns ID Token Hint provided by the Client.
   */
  private getIdTokenHint(parameters: EndSessionRequest): string {
    this.logger.debug(`[${this.constructor.name}] Called getIdTokenHint()`, '9cbc76b6-43cd-4def-a8c5-9e84c14900b9', {
      parameters,
    });

    if (typeof parameters.id_token_hint === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "id_token_hint".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "id_token_hint"`,
        '6013a4dc-c5bc-44e4-aa2a-ed1144c0ab9b',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.id_token_hint;
  }

  /**
   * Fetches a Client from the application's storage based on the provided Client Identifier.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns Client based on the provided Client Identifier.
   */
  private async getClient(parameters: EndSessionRequest): Promise<Client> {
    this.logger.debug(`[${this.constructor.name}] Called getClient()`, '9d507894-77c0-4947-b201-95b1e9f7874a', {
      parameters,
    });

    if (typeof parameters.client_id === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "client_id".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "client_id"`,
        '99b5748b-d5e8-4052-98e6-5ba65d18f7b1',
        { parameters },
        exc,
      );

      throw exc;
    }

    const client = await this.clientService.findOne(parameters.client_id);

    if (client === null) {
      const exc = new InvalidClientException('Invalid Client.');
      this.logger.error(`[${this.constructor.name}] Invalid Client`, 'c4a823c8-08ad-49d5-8156-33aa2fb49362', null, exc);
      throw exc;
    }

    return client;
  }

  /**
   * Parses and validates the Post Logout Redirect URI provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @param client Client of the Request.
   * @returns Parsed and validated Post Logout Redirect URI.
   */
  private getPostLogoutRedirectUri(parameters: EndSessionRequest, client: Client): Nullable<URL> {
    this.logger.debug(
      `[${this.constructor.name}] Called getPostLogoutRedirectUri()`,
      '10592468-ccd0-495e-8021-13c3021f4774',
      { parameters, client },
    );

    if (typeof parameters.post_logout_redirect_uri === 'undefined') {
      return null;
    }

    let url: URL;

    try {
      url = new URL(parameters.post_logout_redirect_uri);
    } catch (exc: unknown) {
      const exception = new InvalidRequestException('Invalid parameter "post_logout_redirect_uri".', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "post_logout_redirect_uri"`,
        'a2e26a96-8a73-40dd-b801-3f1b90b8477f',
        { parameters },
        exception,
      );

      throw exception;
    }

    if (url.hash.length !== 0) {
      const exc = new InvalidRequestException('The Post Logout Redirect URI MUST NOT have a fragment component.');

      this.logger.error(
        `[${this.constructor.name}] The Post Logout Redirect URI MUST NOT have a fragment component`,
        'd4120b62-b22d-4e3f-bcd3-cf72301e6819',
        { url: url.toString() },
        exc,
      );

      throw exc;
    }

    if (client.postLogoutRedirectUris?.includes(url.href) !== true) {
      const exc = new AccessDeniedException('Invalid Post Logout Redirect URI.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Post Logout Redirect URI`,
        'fa700ace-5549-4e49-bd15-c817eb646854',
        { url: url.toString(), client },
        exc,
      );

      throw exc;
    }

    return url;
  }

  /**
   * Checks and returns the State provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns State provided by the Client.
   */
  private getState(parameters: EndSessionRequest): Nullable<string> {
    this.logger.debug(`[${this.constructor.name}] Called getState()`, '700341bc-40cc-4495-aa64-6aaa6ff7bebc', {
      parameters,
    });

    return parameters.state ?? null;
  }

  /**
   * Checks and returns the Logout Hint provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns Logout Hint provided by the Client.
   */
  private getLogoutHint(parameters: EndSessionRequest): Nullable<string> {
    this.logger.debug(`[${this.constructor.name}] Called getLogoutHint()`, 'b97de013-3915-4ce0-96f9-44d0d188f728', {
      parameters,
    });

    return parameters.logout_hint ?? null;
  }

  /**
   * Checks and returns the UI Locales requested by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns UI Locales requested by the Client.
   */
  private getUiLocales(parameters: EndSessionRequest): string[] {
    this.logger.debug(`[${this.constructor.name}] Called getUiLocales()`, '7b4ff95a-f093-416b-aaca-86d93d8dde9b', {
      parameters,
    });

    const requestedUiLocales = parameters.ui_locales?.split(' ') ?? [];

    requestedUiLocales.forEach((requestedUiLocale) => {
      if (!this.settings.uiLocales.includes(requestedUiLocale)) {
        const exc = new InvalidRequestException(`Unsupported UI Locale "${requestedUiLocale}".`);

        this.logger.error(
          `[${this.constructor.name}] Unsupported UI Locale "${requestedUiLocale}"`,
          '8159f8ad-9f7d-4129-949c-a3e53567468d',
          { requested_ui_locale: requestedUiLocale, ui_locales: this.settings.uiLocales },
          exc,
        );

        throw exc;
      }
    });

    return requestedUiLocales;
  }
}
