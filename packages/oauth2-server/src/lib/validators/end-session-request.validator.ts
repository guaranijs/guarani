import { URL, URLSearchParams } from 'url';

import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { EndSessionContext } from '../context/end-session-context';
import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpRequest } from '../http/http.request';
import { HttpMethod } from '../http/http-method.type';
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
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface
  ) {}

  /**
   * Validates the Http End Session Request and returns the actors of the End Session Context.
   *
   * @param request Http Request.
   * @returns End Session Context.
   */
  public async validate(request: HttpRequest): Promise<EndSessionContext> {
    const parameters = this.getEndSessionParameters(request);
    const cookies = request.cookies;

    const idTokenHint = this.getIdTokenHint(parameters);
    const client = await this.getClient(parameters);
    const postLogoutRedirectUri = this.getPostLogoutRedirectUri(parameters, client);
    const state = this.getState(parameters);
    const logoutHint = this.getLogoutHint(parameters);
    const uiLocales = this.getUiLocales(parameters);

    return {
      parameters,
      cookies,
      idTokenHint,
      client,
      postLogoutRedirectUri,
      state,
      logoutHint,
      uiLocales,
    };
  }

  /**
   * Extracts the Parameters of the End Session Request based on the Http Method.
   *
   * @param request Http Request.
   * @returns Parameters of the End Session Request.
   */
  public getEndSessionParameters(request: HttpRequest): URLSearchParams {
    switch (request.method as Extract<HttpMethod, 'GET' | 'POST'>) {
      case 'GET':
        return request.query;

      case 'POST':
        return request.form();
    }
  }

  /**
   * Checks and returns the ID Token Hint provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns ID Token Hint provided by the Client.
   */
  private getIdTokenHint(parameters: URLSearchParams): string {
    const idTokenHint = parameters.get('id_token_hint');

    if (idTokenHint === null) {
      throw new InvalidRequestException('Invalid parameter "id_token_hint".');
    }

    return idTokenHint;
  }

  /**
   * Fetches a Client from the application's storage based on the provided Client Identifier.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns Client based on the provided Client Identifier.
   */
  private async getClient(parameters: URLSearchParams): Promise<Client> {
    const clientId = parameters.get('client_id');

    if (clientId === null) {
      throw new InvalidRequestException('Invalid parameter "client_id".');
    }

    const client = await this.clientService.findOne(clientId);

    if (client === null) {
      throw new InvalidClientException('Invalid Client.');
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
  private getPostLogoutRedirectUri(parameters: URLSearchParams, client: Client): Nullable<URL> {
    const postLogoutRedirectUri = parameters.get('post_logout_redirect_uri');

    if (postLogoutRedirectUri === null) {
      return null;
    }

    let url: URL;

    try {
      url = new URL(postLogoutRedirectUri);
    } catch (exc: unknown) {
      throw new InvalidRequestException('Invalid parameter "post_logout_redirect_uri".', { cause: exc });
    }

    if (url.hash.length !== 0) {
      throw new InvalidRequestException('The Post Logout Redirect URI MUST NOT have a fragment component.');
    }

    if (!client.postLogoutRedirectUris.includes(url.href)) {
      throw new AccessDeniedException('Invalid Post Logout Redirect URI.');
    }

    return url;
  }

  /**
   * Checks and returns the State provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns State provided by the Client.
   */
  private getState(parameters: URLSearchParams): Nullable<string> {
    return parameters.get('state');
  }

  /**
   * Checks and returns the Logout Hint provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns Logout Hint provided by the Client.
   */
  private getLogoutHint(parameters: URLSearchParams): Nullable<string> {
    return parameters.get('logout_hint');
  }

  /**
   * Checks and returns the UI Locales requested by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns UI Locales requested by the Client.
   */
  private getUiLocales(parameters: URLSearchParams): string[] {
    const requestedUiLocales = parameters.get('ui_locales')?.split(' ') ?? [];

    requestedUiLocales.forEach((requestedUiLocale) => {
      if (!this.settings.uiLocales.includes(requestedUiLocale)) {
        throw new InvalidRequestException(`Unsupported UI Locale "${requestedUiLocale}".`);
      }
    });

    return requestedUiLocales;
  }
}
