import { Inject, Injectable, InjectAll } from '@guarani/di';
import { removeNullishValues } from '@guarani/objects';

import { Client } from '../entities/client';
import { User } from '../entities/user';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { CodeAuthorizationParameters } from '../models/code.authorization-parameters';
import { CodeAuthorizationResponse } from '../models/code.authorization-response';
import { IPkceMethod } from '../pkce/pkce-method.interface';
import { IAuthorizationCodeService } from '../services/authorization-code.service.interface';
import { ResponseMode } from '../types/response-mode';
import { ResponseType } from '../types/response-type';
import { IResponseType } from './response-type.interface';

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
export class CodeResponseType implements IResponseType {
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
   * @param pkceMethods PKCE Methods.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   */
  public constructor(
    @Inject('AuthorizationCodeService') private readonly authorizationCodeService: IAuthorizationCodeService,
    @InjectAll('PkceMethod') private readonly pkceMethods: IPkceMethod[]
  ) {
    if (this.pkceMethods.length === 0) {
      throw new TypeError('Missing PKCE Methods for Code Response Type.');
    }
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
   * @param parameters Parameters of the Authorization Request.
   * @param client Client of the Request.
   * @param user End User represented by the Client.
   * @returns Authorization Code Response.
   */
  public async handle(
    parameters: CodeAuthorizationParameters,
    client: Client,
    user: User
  ): Promise<CodeAuthorizationResponse> {
    this.checkParameters(parameters);
    const authorizationCode = await this.authorizationCodeService.createAuthorizationCode(parameters, client, user);
    return removeNullishValues<CodeAuthorizationResponse>({ code: authorizationCode.code, state: parameters.state });
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param parameters Parameters of the Authorization Request.
   */
  private checkParameters(parameters: CodeAuthorizationParameters): void {
    const { code_challenge, code_challenge_method } = parameters;

    if (typeof code_challenge !== 'string') {
      throw new InvalidRequestException('Invalid parameter "code_challenge".');
    }

    if (
      code_challenge_method !== undefined &&
      this.pkceMethods.find((pkceMethod) => pkceMethod.name === code_challenge_method) === undefined
    ) {
      throw new InvalidRequestException(`Unsupported code_challenge_method "${code_challenge_method}".`);
    }
  }
}
