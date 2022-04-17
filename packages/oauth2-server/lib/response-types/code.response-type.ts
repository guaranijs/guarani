import { Inject, Injectable, InjectAll } from '@guarani/ioc';
import { removeNullishValues } from '@guarani/objects';

import { ClientEntity } from '../entities/client.entity';
import { UserEntity } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { Request } from '../http/request';
import { PkceMethod } from '../pkce/pkce-method';
import { SupportedResponseMode } from '../response-modes/types/supported-response-mode';
import { AuthorizationCodeService } from '../services/authorization-code.service';
import { getAllowedScopes } from '../utils';
import { ResponseType } from './response-type';
import { AuthorizationCodeParameters } from './types/authorization-code.parameters';
import { AuthorizationCodeResponse } from './types/authorization-code.response';
import { SupportedResponseType } from './types/supported-response-type';

/**
 * Implementation of the Code Response Type.
 *
 * In this Response Type the Client obtains consent from the End User and receives an Authorization Code
 * that has to be exchanged at the Token Endpoint for the Access Token.
 *
 * The Authorization Code is returned at the Redirect URI of the Client.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1
 */
@Injectable()
export class CodeResponseType implements ResponseType {
  /**
   * Name of the Response Type.
   */
  public readonly name: SupportedResponseType = 'code';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: SupportedResponseMode = 'query';

  /**
   * PKCE Methods.
   */
  private readonly pkceMethods: PkceMethod[];

  /**
   * Instance of the Authorization Code Service.
   */
  private readonly authorizationCodeService: AuthorizationCodeService;

  /**
   * Instantiates a new Code Response Type.
   *
   * @param pkceMethods PKCE Methods.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   */
  public constructor(
    @InjectAll('PkceMethod') pkceMethods: PkceMethod[],
    @Inject('AuthorizationCodeService') authorizationCodeService: AuthorizationCodeService
  ) {
    if (pkceMethods.length === 0) {
      throw new TypeError('Missing PKCE Methods for Code Response Type.');
    }

    this.pkceMethods = pkceMethods;
    this.authorizationCodeService = authorizationCodeService;
  }

  /**
   * Creates the Authorization Response with the Authorization Grant used by the Client on behalf of the End User.
   *
   * In this part of the Authorization process the Authorization Server checks the scopes requested by the Client and,
   * if authorized by the End User, issues an Authorization Code as a temporary Authorization Grant to the Client.
   *
   * The format of the Authorization Response is exemplified as follows:
   *
   * ```json
   *   {
   *     "code": "XUFJGWdzVCx8K153POB1XasJB-gUjeAj",
   *     "state": "VGLgcR2TLMhguh7t"
   *   }
   * ```
   *
   * Both the Code Challenge and the PKCE Method used by the Client to generate the PKCE Code Challenge are registered
   * at the application's storage together with the issued Authorization Code for verification at the Token Endpoint.
   *
   * @param request HTTP Request.
   * @param client OAuth 2.0 Client of the Request.
   * @param user End User represented by the Client.
   * @returns Authorization Response.
   */
  public async createAuthorizationResponse(
    request: Request,
    client: ClientEntity,
    user: UserEntity
  ): Promise<AuthorizationCodeResponse> {
    const params = <AuthorizationCodeParameters>request.data;

    this.checkParameters(params);

    const scopes = getAllowedScopes(client, params.scope);
    const authorizationCode = await this.authorizationCodeService.createAuthorizationCode(params, scopes, client, user);

    return removeNullishValues<AuthorizationCodeResponse>({ code: authorizationCode.code, state: params.state });
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param params Parameters of the Authorization Request.
   */
  private checkParameters(params: AuthorizationCodeParameters): void {
    const { code_challenge, code_challenge_method } = params;

    if (typeof code_challenge !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "code_challenge".' });
    }

    if (
      code_challenge_method !== undefined &&
      this.pkceMethods.find((pkceMethod) => pkceMethod.name === code_challenge_method) === undefined
    ) {
      throw new InvalidRequestException({
        error_description: `Unsupported code_challenge_method "${code_challenge_method}".`,
      });
    }
  }
}
