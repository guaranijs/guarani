import { Injectable } from '@guarani/ioc';
import { Dict } from '@guarani/types';

import { URL, URLSearchParams } from 'url';

import { Response } from '../http/response';
import { ResponseMode } from './response-mode';
import { SupportedResponseMode } from './types/supported-response-mode';

/**
 * Implementation of the Query Response Mode as defined by
 * {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes OAuth 2.0 Multiple Response Type Encoding Practices}.
 */
@Injectable()
export class QueryResponseMode implements ResponseMode {
  /**
   * Name of the Response Mode.
   */
  public readonly name: SupportedResponseMode = 'query';

  /**
   * Creates a Redirect Response to the provided Redirect URI with the provided Parameters at the Query of the URI.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param params Authorization Response Parameters that will be returned to the Client Application.
   * @returns HTTP Response containing the Authorization Response Parameters.
   */
  public createHttpResponse(redirectUri: string, params: Dict): Response {
    const url = new URL(redirectUri);
    const searchParams = new URLSearchParams(params);

    url.search = searchParams.toString();

    return new Response().redirect(url.href);
  }
}
