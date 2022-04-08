import { Injectable } from '@guarani/ioc';
import { Dict } from '@guarani/types';

import { URL, URLSearchParams } from 'url';

import { Response } from '../http/response';
import { ResponseMode } from './response-mode';
import { SupportedResponseMode } from './types/supported-response-mode';

/**
 * Implementation of the Fragment Response Mode as defined by
 * {@link https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes OAuth 2.0 Multiple Response Type Encoding Practices}.
 */
@Injectable()
export class FragmentResponseMode implements ResponseMode {
  /**
   * Name of the Response Mode.
   */
  public readonly name: SupportedResponseMode = 'fragment';

  /**
   * Creates a Redirect Response to the provided Redirect URI with the provided Parameters at the Fragment of the URI.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param params Authorization Response Parameters that will be returned to the Client Application.
   * @returns HTTP Response containing the Authorization Response Parameters.
   */
  public createHttpResponse(redirectUri: string, params: Dict): Response {
    const url = new URL(redirectUri);
    const fragmentParams = new URLSearchParams(params);

    url.hash = fragmentParams.toString();

    return new Response().redirect(url.href);
  }
}
