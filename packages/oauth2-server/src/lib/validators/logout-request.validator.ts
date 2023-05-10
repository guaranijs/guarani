import { Inject, Injectable } from '@guarani/di';

import { URL } from 'url';

import { LogoutContext } from '../context/logout.context';
import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { LogoutRequest } from '../requests/logout-request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';

/**
 * Implementation of the Logout Request Validator.
 */
@Injectable()
export class LogoutRequestValidator {
  /**
   * Instantiates a new Logout Request Validator.
   *
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface
  ) {}

  /**
   * Validates the Http Logout Request and returns the actors of the Logout Context.
   *
   * @param request Http Request.
   * @returns Logout Context.
   */
  public async validate(request: HttpRequest): Promise<LogoutContext> {
    const parameters = this.getLogoutParameters(request);

    const state = this.getState(parameters);
    const idTokenHint = this.getIdTokenHint(parameters);
    const client = await this.getClient(parameters);
    const postLogoutRedirectUri = this.getPostLogoutRedirectUri(parameters, client);
    const logoutHint = this.getLogoutHint(parameters);
    const uiLocales = this.getUiLocales(parameters);

    return {
      parameters,
      idTokenHint,
      client,
      postLogoutRedirectUri,
      state,
      logoutHint,
      uiLocales,
    };
  }

  /**
   * Extracts the Parameters of the Logout Request based on the Http Method.
   *
   * @param request Http Request.
   * @returns Parameters of the Logout Request.
   */
  public getLogoutParameters(request: HttpRequest): LogoutRequest {
    switch (<Extract<HttpMethod, 'GET' | 'POST'>>request.method) {
      case 'GET':
        return <LogoutRequest>request.query;

      case 'POST':
        return <LogoutRequest>request.body;
    }
  }

  /**
   * Checks and returns the State provided by the Client.
   *
   * @param parameters Parameters of the Logout Request.
   * @returns State provided by the Client.
   */
  private getState(parameters: LogoutRequest): string | undefined {
    if (typeof parameters.state !== 'undefined' && typeof parameters.state !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "state".' });
    }

    return parameters.state;
  }

  /**
   * Checks and returns the ID Token Hint provided by the Client.
   *
   * @param parameters Parameters of the Logout Request.
   * @returns ID Token Hint provided by the Client.
   */
  private getIdTokenHint(parameters: LogoutRequest): string {
    if (typeof parameters.id_token_hint !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "id_token_hint".', state: parameters.state });
    }

    return parameters.id_token_hint;
  }

  /**
   * Fetches a Client from the application's storage based on the provided Client Identifier.
   *
   * @param parameters Parameters of the Logout Request.
   * @returns Client based on the provided Client Identifier.
   */
  private async getClient(parameters: LogoutRequest): Promise<Client> {
    if (typeof parameters.client_id !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "client_id".', state: parameters.state });
    }

    const client = await this.clientService.findOne(parameters.client_id);

    if (client === null) {
      throw new InvalidClientException({ description: 'Invalid Client.', state: parameters.state });
    }

    return client;
  }

  /**
   * Parses and validates the Post Logout Redirect URI provided by the Client.
   *
   * @param parameters Parameters of the Logout Request.
   * @param client Client of the Request.
   * @returns Parsed and validated Post Logout Redirect URI.
   */
  private getPostLogoutRedirectUri(parameters: LogoutRequest, client: Client): URL {
    if (typeof parameters.post_logout_redirect_uri !== 'string') {
      throw new InvalidRequestException({
        description: 'Invalid parameter "post_logout_redirect_uri".',
        state: parameters.state,
      });
    }

    let postLogoutRedirectUri: URL;

    try {
      postLogoutRedirectUri = new URL(parameters.post_logout_redirect_uri);
    } catch (exc: unknown) {
      throw new InvalidRequestException({
        description: 'Invalid parameter "post_logout_redirect_uri".',
        state: parameters.state,
      });
    }

    if (postLogoutRedirectUri.hash.length !== 0) {
      throw new InvalidRequestException({
        description: 'The Post Logout Redirect URI MUST NOT have a fragment component.',
        state: parameters.state,
      });
    }

    if (!client.postLogoutRedirectUris.includes(postLogoutRedirectUri.href)) {
      throw new AccessDeniedException({ description: 'Invalid Post Logout Redirect URI.', state: parameters.state });
    }

    return postLogoutRedirectUri;
  }

  /**
   * Checks and returns the Logout Hint provided by the Client.
   *
   * @param parameters Parameters of the Logout Request.
   * @returns Logout Hint provided by the Client.
   */
  private getLogoutHint(parameters: LogoutRequest): string | undefined {
    if (typeof parameters.logout_hint !== 'undefined' && typeof parameters.logout_hint !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "logout_hint".', state: parameters.state });
    }

    return parameters.logout_hint;
  }

  /**
   * Checks and returns the UI Locales requested by the Client.
   *
   * @param parameters Parameters of the Logout Request.
   * @returns UI Locales requested by the Client.
   */
  private getUiLocales(parameters: LogoutRequest): string[] {
    if (typeof parameters.ui_locales !== 'undefined' && typeof parameters.ui_locales !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "ui_locales".', state: parameters.state });
    }

    const requestedUiLocales = parameters.ui_locales?.split(' ') ?? [];

    requestedUiLocales.forEach((requestedUiLocale) => {
      if (!this.settings.uiLocales.includes(requestedUiLocale)) {
        throw new InvalidRequestException({
          description: `Unsupported UI Locale "${requestedUiLocale}".`,
          state: parameters.state,
        });
      }
    });

    return requestedUiLocales;
  }
}
