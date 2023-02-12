import { Inject, Injectable, InjectAll } from '@guarani/di';

import { Consent } from '../entities/consent.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { CodeAuthorizationRequest } from '../messages/code.authorization-request';
import { CodeAuthorizationResponse } from '../messages/code.authorization-response';
import { PkceInterface } from '../pkce/pkce.interface';
import { PKCE } from '../pkce/pkce.token';
import { ResponseMode } from '../response-modes/response-mode.type';
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
   * @param pkce PKCE Methods.
   */
  public constructor(
    @Inject(AUTHORIZATION_CODE_SERVICE) private readonly authorizationCodeService: AuthorizationCodeServiceInterface,
    @InjectAll(PKCE) private readonly pkce: PkceInterface[]
  ) {
    if (this.pkce.length === 0) {
      throw new TypeError('Missing PKCE Methods for response_type "code".');
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
   * @param consent Consent with the scopes granted by the End User.
   * @returns Authorization Code Response.
   */
  public async handle(consent: Consent): Promise<CodeAuthorizationResponse> {
    const { client, parameters, user } = consent;

    this.checkParameters(<CodeAuthorizationRequest>parameters);

    const authorizationCode = await this.authorizationCodeService.create(
      <CodeAuthorizationRequest>parameters,
      client,
      user
    );

    return { code: authorizationCode.code, state: parameters.state };
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param parameters Parameters of the Authorization Request.
   */
  private checkParameters(parameters: CodeAuthorizationRequest): void {
    const { code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod } = parameters;

    if (typeof codeChallenge !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "code_challenge".' });
    }

    if (codeChallengeMethod !== undefined && !this.pkce.map((pkce) => pkce.name).includes(codeChallengeMethod)) {
      throw new InvalidRequestException({
        description: `Unsupported code_challenge_method "${codeChallengeMethod}".`,
      });
    }
  }
}