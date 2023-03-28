import { Inject, Injectable, InjectAll } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { CodeAuthorizationRequest } from '../messages/code.authorization-request';
import { CodeAuthorizationResponse } from '../messages/code.authorization-response';
import { IdTokenAuthorizationResponse } from '../messages/id-token.authorization-response';
import { PkceInterface } from '../pkce/pkce.interface';
import { PKCE } from '../pkce/pkce.token';
import { ResponseMode } from '../response-modes/response-mode.type';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

/**
 * Implementation of the **Code ID Token** Response Type.
 *
 * In this Response Type the Client obtains consent from the End User and receives a Code Authorization Response
 * to exchange for an Access Token at the Token Endpoint and an ID Token without the need for a second visit
 * to the Authorization Server.
 *
 * The Authorization Code and ID Token are returned at the Redirect URI of the Client.
 *
 * This **COULD** lead to a potential security issue, since the URI is usually saved at the browser's history.
 * A malware could read the history and extract the ID Token from one of the Authorization Responses.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2
 * @see https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth
 */
@Injectable()
export class CodeIdTokenResponseType implements ResponseTypeInterface {
  /**
   * Name of the Response Type.
   */
  public readonly name: ResponseType = 'code id_token';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: ResponseMode = 'fragment';

  /**
   * Instantiates a new Code Response Type.
   *
   * @param idTokenHandler Instance of the ID Token Handler.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   * @param pkce PKCE Methods.
   */
  public constructor(
    private readonly idTokenHandler: IdTokenHandler,
    @Inject(AUTHORIZATION_CODE_SERVICE) private readonly authorizationCodeService: AuthorizationCodeServiceInterface,
    @InjectAll(PKCE) private readonly pkce: PkceInterface[]
  ) {
    if (this.pkce.length === 0) {
      throw new TypeError('Missing PKCE Methods for response_type "code id_token".');
    }
  }

  /**
   * Creates and returns a Code Authorization Response and ID Token Response to the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param session Session with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Code Authorization Response and ID Token Response.
   */
  public async handle(
    parameters: CodeAuthorizationRequest,
    session: Session,
    consent: Consent
  ): Promise<CodeAuthorizationResponse & IdTokenAuthorizationResponse> {
    const { scopes } = consent;

    this.checkParameters(parameters);

    if (!scopes.includes('openid')) {
      throw new InvalidRequestException({ description: 'Missing required scope "openid".', state: parameters.state });
    }

    const authorizationCode = await this.authorizationCodeService.create(parameters, session, consent);
    const idToken = await this.idTokenHandler.generateIdToken(consent, null, authorizationCode, {
      nonce: parameters.nonce,
      auth_time: parameters.max_age !== undefined ? Math.floor(session.createdAt.getTime() / 1000) : undefined,
    });

    return removeUndefined<CodeAuthorizationResponse & IdTokenAuthorizationResponse>({
      code: authorizationCode.code,
      id_token: idToken,
      state: parameters.state,
    });
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
      nonce,
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
        description: 'Invalid response_mode "query" for response_type "code id_token".',
        state: parameters.state,
      });
    }

    if (typeof nonce !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "nonce".', state: parameters.state });
    }
  }
}
