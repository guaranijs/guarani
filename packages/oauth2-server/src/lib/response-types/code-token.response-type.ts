import { Inject, Injectable, InjectAll } from '@guarani/di';

import { Consent } from '../entities/consent.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { CodeAuthorizationRequest } from '../messages/code.authorization-request';
import { CodeAuthorizationResponse } from '../messages/code.authorization-response';
import { TokenAuthorizationResponse } from '../messages/token.authorization-response';
import { PkceInterface } from '../pkce/pkce.interface';
import { PKCE } from '../pkce/pkce.token';
import { ResponseMode } from '../response-modes/response-mode.type';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

/**
 * Implementation of the **Code Token** Response Type.
 *
 * In this Response Type the Client obtains consent from the End User and receives a Code Authorization Response
 * to exchange for an Access Token at the Token Endpoint an Access Token without the need for a second visit
 * to the Authorization Server.
 *
 * The tokens are returned at the Redirect URI of the Client.
 *
 * This **COULD** lead to a potential security issue, since the URI is usually saved at the browser's history.
 * A malware could read the history and extract the Access Token from one of the Authorization Responses.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2
 * @see https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth
 */
@Injectable()
export class CodeTokenResponseType implements ResponseTypeInterface {
  /**
   * Name of the Response Type.
   */
  public readonly name: ResponseType = 'code token';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: ResponseMode = 'fragment';

  /**
   * Instantiates a new Code Token Response Type.
   *
   * @param accessTokenService Instance of the Access Token Service.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   * @param pkce PKCE Methods.
   */
  public constructor(
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(AUTHORIZATION_CODE_SERVICE) private readonly authorizationCodeService: AuthorizationCodeServiceInterface,
    @InjectAll(PKCE) private readonly pkce: PkceInterface[]
  ) {
    if (this.pkce.length === 0) {
      throw new TypeError('Missing PKCE Methods for response_type "code token".');
    }
  }

  /**
   * Creates and returns an Authorization Code and Access Token Response to the Client.
   *
   * @param consent Consent with the scopes granted by the End User.
   * @returns Authorization Code and Access Token Response.
   */
  public async handle(consent: Consent): Promise<CodeAuthorizationResponse & TokenAuthorizationResponse> {
    const { client, parameters, scopes, user } = consent;

    this.checkParameters(<CodeAuthorizationRequest>parameters);

    const authorizationCode = await this.authorizationCodeService.create(consent);
    const accessToken = await this.accessTokenService.create(scopes, client, user);
    const token = createTokenResponse(accessToken);

    return <CodeAuthorizationResponse & TokenAuthorizationResponse>{
      ...token,
      code: authorizationCode.code,
      state: parameters.state,
    };
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param parameters Parameters of the Authorization Request.
   */
  private checkParameters(parameters: CodeAuthorizationRequest): void {
    const {
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      response_mode: responseMode,
    } = parameters;

    if (typeof codeChallenge !== 'string') {
      throw new InvalidRequestException({
        description: 'Invalid parameter "code_challenge".',
        state: parameters.state,
      });
    }

    if (codeChallengeMethod !== undefined && !this.pkce.map((pkce) => pkce.name).includes(codeChallengeMethod)) {
      throw new InvalidRequestException({
        description: `Unsupported code_challenge_method "${codeChallengeMethod}".`,
        state: parameters.state,
      });
    }

    if (responseMode === 'query') {
      throw new InvalidRequestException({
        description: 'Invalid response_mode "query" for response_type "code token".',
        state: parameters.state,
      });
    }
  }
}
