import { Inject, Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { CodeAuthorizationContext } from '../context/authorization/code.authorization.context';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { ResponseMode } from '../response-modes/response-mode.type';
import { CodeAuthorizationResponse } from '../responses/authorization/code.authorization-response';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { ResponseType } from './response-type.type';
import { ResponseTypeInterface } from './response-type.interface';

/**
 * Implementation of the **Code** Response Type.
 *
 * In this Response Type the Client obtains consent from the End User and receives an Authorization Code
 * that has to be exchanged at the Token Endpoint for the Access Token.
 *
 * The Authorization Code is returned at the Redirect URI of the Client.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1
 */
@Injectable()
export class CodeResponseType implements ResponseTypeInterface {
  /**
   * Name of the Response Type.
   */
  public readonly name: ResponseType = 'code';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: ResponseMode = 'query';

  /**
   * Instantiates a new Code Response Type.
   *
   * @param authorizationCodeService Instance of the Authorization Code Service.
   */
  public constructor(
    @Inject(AUTHORIZATION_CODE_SERVICE) private readonly authorizationCodeService: AuthorizationCodeServiceInterface
  ) {}

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
   * @param context Authorization Request Context.
   * @param login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Authorization Code Response.
   */
  public async handle(
    context: CodeAuthorizationContext,
    login: Login,
    consent: Consent
  ): Promise<CodeAuthorizationResponse> {
    const { parameters } = context;
    const authorizationCode = await this.authorizationCodeService.create(parameters, login, consent);
    return removeNullishValues<CodeAuthorizationResponse>({ code: authorizationCode.code, state: parameters.state });
  }
}
