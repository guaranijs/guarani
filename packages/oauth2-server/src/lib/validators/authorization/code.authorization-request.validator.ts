import { Inject, Injectable, InjectAll, Optional } from '@guarani/di';

import { CodeAuthorizationContext } from '../../context/authorization/code.authorization-context';
import { DisplayInterface } from '../../displays/display.interface';
import { DISPLAY } from '../../displays/display.token';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { ClaimsHandler } from '../../handlers/claims.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { PkceInterface } from '../../pkces/pkce.interface';
import { PKCE } from '../../pkces/pkce.token';
import { CodeAuthorizationRequest } from '../../requests/authorization/code.authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { RESPONSE_MODE } from '../../response-modes/response-mode.token';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { RESPONSE_TYPE } from '../../response-types/response-type.token';
import { ResponseType } from '../../response-types/response-type.type';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { CLIENT_SERVICE } from '../../services/client.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { AuthorizationRequestValidator } from './authorization-request.validator';

/**
 * Implementation of the **Code** Authorization Request Validator.
 */
@Injectable()
export class CodeAuthorizationRequestValidator extends AuthorizationRequestValidator<CodeAuthorizationContext> {
  /**
   * Name of the Response Type that uses this Validator.
   */
  public readonly name: ResponseType = 'code';

  /**
   * Instantiates a new Code Authorization Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param displays Displays registered at the Authorization Server.
   * @param pkces PKCE Code Challenge Methods registered at the Authorization Server.
   * @param claimsHandler Instance of the Claims Handler.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) protected override readonly settings: Settings,
    @Inject(CLIENT_SERVICE) protected override readonly clientService: ClientServiceInterface,
    @InjectAll(RESPONSE_MODE) protected override readonly responseModes: ResponseModeInterface[],
    @InjectAll(RESPONSE_TYPE) protected override readonly responseTypes: ResponseTypeInterface[],
    @InjectAll(DISPLAY) protected override readonly displays: DisplayInterface[],
    @InjectAll(PKCE) protected readonly pkces: PkceInterface[],
    @Optional() protected override readonly claimsHandler?: ClaimsHandler,
  ) {
    super(logger, scopeHandler, settings, clientService, responseModes, responseTypes, displays, claimsHandler);
  }

  /**
   * Validates the Http Authorization Request and returns the actors of the Authorization Context.
   *
   * @param request Http Request.
   * @returns Authorization Context.
   */
  public override async validate(request: HttpRequest): Promise<CodeAuthorizationContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '6067ee3a-768c-4603-9ece-39942b144506', {
      request,
    });

    const context = await super.validate(request);

    const { parameters } = context;

    const codeChallenge = this.getCodeChallenge(parameters);
    const codeChallengeMethod = this.getCodeChallengeMethod(parameters);

    Object.assign<CodeAuthorizationContext, Partial<CodeAuthorizationContext>>(context, {
      codeChallenge,
      codeChallengeMethod,
    });

    this.logger.debug(
      `[${this.constructor.name}] Code Authorization Request validation completed`,
      '63363efb-6330-4b05-9805-348348388c69',
      { context },
    );

    return context;
  }

  /**
   * Retrieves the Code Challenge provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Code Challenge provided by the Client.
   */
  protected getCodeChallenge(parameters: CodeAuthorizationRequest): string {
    this.logger.debug(`[${this.constructor.name}] Called getCodeChallenge()`, '67d2dbc9-9b68-455b-bc67-e05b18749d4c', {
      parameters,
    });

    if (typeof parameters.code_challenge === 'undefined') {
      const exc1 = new InvalidRequestException('Invalid parameter "code_challenge".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "code_challenge"`,
        'b3f1c7cb-74cc-480a-8d17-431a46d4f945',
        { parameters },
        exc1,
      );

      throw exc1;
    }

    return parameters.code_challenge;
  }

  /**
   * Retrieves the PKCE Method requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns PKCE Method requested by the Client.
   */
  protected getCodeChallengeMethod(parameters: CodeAuthorizationRequest): PkceInterface {
    this.logger.debug(
      `[${this.constructor.name}] Called getCodeChallengeMethod()`,
      '56628249-71ce-4cba-b8eb-67be0c99beef',
      { parameters },
    );

    const codeChallengeMethodName = parameters.code_challenge_method ?? 'S256';
    const codeChallengeMethod = this.pkces.find((pkceMethod) => pkceMethod.name === codeChallengeMethodName);

    if (typeof codeChallengeMethod === 'undefined') {
      const exc1 = new InvalidRequestException(`Unsupported code_challenge_method "${codeChallengeMethodName}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported code_challenge_method "${codeChallengeMethodName}"`,
        '815450a9-3c8c-400e-834c-734e696a838b',
        null,
        exc1,
      );

      throw exc1;
    }

    return codeChallengeMethod;
  }
}
