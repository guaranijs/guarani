import { Inject, Injectable } from '@guarani/di';

import { CodeAuthorizationContext } from '../context/authorization/code.authorization-context';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { Logger } from '../logger/logger';
import { ResponseMode } from '../response-modes/response-mode.type';
import { CodeAuthorizationResponse } from '../responses/authorization/code.authorization-response';
import { IdTokenAuthorizationResponse } from '../responses/authorization/id-token.authorization-response';
import { TokenAuthorizationResponse } from '../responses/authorization/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

/**
 * Implementation of the **Code ID Token Token** Response Type.
 *
 * In this Response Type the Client obtains consent from the End User and receives a Code Authorization Response
 * to exchange for an Access Token at the Token Endpoint andd an Access Token and ID Token without the need
 * for a second visit to the Authorization Server.
 *
 * The Authorization Code, Access Token and ID Token are returned at the Redirect URI of the Client.
 *
 * This **COULD** lead to a potential security issue, since the URI is usually saved at the browser's history.
 * A malware could read the history and extract the ID Token from one of the Authorization Responses.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2
 * @see https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth
 */
@Injectable()
export class CodeIdTokenTokenResponseType implements ResponseTypeInterface {
  /**
   * Name of the Response Type.
   */
  public readonly name: ResponseType = 'code id_token token';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: ResponseMode = 'fragment';

  /**
   * Instantiates a new Code Response Type.
   *
   * @param logger Logger of the Authorization Server.
   * @param idTokenHandler Instance of the ID Token Handler.
   * @param accessTokenService Instance of the Access Token Service.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly idTokenHandler: IdTokenHandler,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(AUTHORIZATION_CODE_SERVICE) private readonly authorizationCodeService: AuthorizationCodeServiceInterface,
  ) {}

  /**
   * Creates and returns a Code Authorization Response and an Access Token and ID Token Response to the Client.
   *
   * @param context Authorization Request Context.
   * @param login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Code Authorization Response and Access Token and ID Token Response.
   */
  public async handle(
    context: CodeAuthorizationContext,
    login: Login,
    consent: Consent,
  ): Promise<CodeAuthorizationResponse & IdTokenAuthorizationResponse & TokenAuthorizationResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '1a03e197-2b75-48f7-a504-afff794e91df', {
      context,
      login,
      consent,
    });

    const { maxAge, nonce, parameters } = context;
    const { client, scopes, user } = consent;

    if (!scopes.includes('openid')) {
      const exc = new InvalidRequestException('Missing required scope "openid".');

      this.logger.error(
        `[${this.constructor.name}] Missing required scope "openid"`,
        'dc5c6e1f-8ae2-4369-a5e3-dadcebdb4694',
        { scopes },
        exc,
      );

      throw exc;
    }

    const authorizationCode = await this.authorizationCodeService.create(parameters, login, consent);
    const accessToken = await this.accessTokenService.create(scopes, client, user);
    const idToken = await this.idTokenHandler.generateIdToken(login, consent, accessToken, authorizationCode, {
      maxAge: maxAge ?? undefined,
      nonce: nonce ?? undefined,
    });

    const response = createTokenResponse(accessToken, null) as CodeAuthorizationResponse &
      IdTokenAuthorizationResponse &
      TokenAuthorizationResponse;

    response.code = authorizationCode.id;
    response.id_token = idToken;

    this.logger.debug(
      `[${this.constructor.name}] Completed "${this.name}" Response Type`,
      '42aa169a-932e-4317-ac98-a144aeed26c4',
      { response },
    );

    return response;
  }
}
