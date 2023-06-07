import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { URL } from 'url';

import { EndSessionContext } from '../context/end-session-context';
import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
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

    const state = this.getState(parameters);
    const idTokenHint = this.getIdTokenHint(parameters);
    const client = await this.getClient(parameters);
    const postLogoutRedirectUri = this.getPostLogoutRedirectUri(parameters, client);
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
  public getEndSessionParameters(request: HttpRequest): EndSessionRequest {
    switch (request.method as Extract<HttpMethod, 'GET' | 'POST'>) {
      case 'GET':
        return request.query as EndSessionRequest;

      case 'POST':
        return request.body as EndSessionRequest;
    }
  }

  /**
   * Checks and returns the State provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns State provided by the Client.
   */
  private getState(parameters: EndSessionRequest): Nullable<string> {
    if (typeof parameters.state !== 'undefined' && typeof parameters.state !== 'string') {
      throw new InvalidRequestException('Invalid parameter "state".');
    }

    return parameters.state ?? null;
  }

  /**
   * Checks and returns the ID Token Hint provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns ID Token Hint provided by the Client.
   */
  private getIdTokenHint(parameters: EndSessionRequest): string {
    if (typeof parameters.id_token_hint !== 'string') {
      throw new InvalidRequestException('Invalid parameter "id_token_hint".');
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
    if (typeof parameters.client_id !== 'string') {
      throw new InvalidRequestException('Invalid parameter "client_id".');
    }

    const client = await this.clientService.findOne(parameters.client_id);

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
  private getPostLogoutRedirectUri(parameters: EndSessionRequest, client: Client): Nullable<URL> {
    if (
      typeof parameters.post_logout_redirect_uri !== 'undefined' &&
      typeof parameters.post_logout_redirect_uri !== 'string'
    ) {
      throw new InvalidRequestException('Invalid parameter "post_logout_redirect_uri".');
    }

    if (typeof parameters.post_logout_redirect_uri === 'undefined') {
      return null;
    }

    let postLogoutRedirectUri: URL;

    try {
      postLogoutRedirectUri = new URL(parameters.post_logout_redirect_uri);
    } catch (exc: unknown) {
      throw new InvalidRequestException('Invalid parameter "post_logout_redirect_uri".', { cause: exc });
    }

    if (postLogoutRedirectUri.hash.length !== 0) {
      throw new InvalidRequestException('The Post Logout Redirect URI MUST NOT have a fragment component.');
    }

    if (!client.postLogoutRedirectUris.includes(postLogoutRedirectUri.href)) {
      throw new AccessDeniedException('Invalid Post Logout Redirect URI.');
    }

    return postLogoutRedirectUri;
  }

  /**
   * Checks and returns the Logout Hint provided by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns Logout Hint provided by the Client.
   */
  private getLogoutHint(parameters: EndSessionRequest): Nullable<string> {
    if (typeof parameters.logout_hint !== 'undefined' && typeof parameters.logout_hint !== 'string') {
      throw new InvalidRequestException('Invalid parameter "logout_hint".');
    }

    return parameters.logout_hint ?? null;
  }

  /**
   * Checks and returns the UI Locales requested by the Client.
   *
   * @param parameters Parameters of the End Session Request.
   * @returns UI Locales requested by the Client.
   */
  private getUiLocales(parameters: EndSessionRequest): string[] {
    if (typeof parameters.ui_locales !== 'undefined' && typeof parameters.ui_locales !== 'string') {
      throw new InvalidRequestException('Invalid parameter "ui_locales".');
    }

    const requestedUiLocales = parameters.ui_locales?.split(' ') ?? [];

    requestedUiLocales.forEach((requestedUiLocale) => {
      if (!this.settings.uiLocales.includes(requestedUiLocale)) {
        throw new InvalidRequestException(`Unsupported UI Locale "${requestedUiLocale}".`);
      }
    });

    return requestedUiLocales;
  }
}
