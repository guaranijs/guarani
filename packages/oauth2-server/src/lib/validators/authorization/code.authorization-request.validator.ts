import { Inject, Injectable, InjectAll } from '@guarani/di';

import { CodeAuthorizationContext } from '../../context/authorization/code.authorization.context';
import { DisplayInterface } from '../../displays/display.interface';
import { DISPLAY } from '../../displays/display.token';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
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
export class CodeAuthorizationRequestValidator extends AuthorizationRequestValidator<
  CodeAuthorizationRequest,
  CodeAuthorizationContext
> {
  /**
   * Name of the Response Type that uses this Validator.
   */
  public readonly name: ResponseType = 'code';

  /**
   * Instantiates a new Code Authorization Request Validator.
   *
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param displays Displays registered at the Authorization Server.
   * @param pkces PKCE Code Challenge Methods registered at the Authorization Server.
   */
  public constructor(
    protected override readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) protected override readonly settings: Settings,
    @Inject(CLIENT_SERVICE) protected override readonly clientService: ClientServiceInterface,
    @InjectAll(RESPONSE_MODE) protected override readonly responseModes: ResponseModeInterface[],
    @InjectAll(RESPONSE_TYPE) protected override readonly responseTypes: ResponseTypeInterface[],
    @InjectAll(DISPLAY) protected override readonly displays: DisplayInterface[],
    @InjectAll(PKCE) protected readonly pkces: PkceInterface[]
  ) {
    super(scopeHandler, settings, clientService, responseModes, responseTypes, displays);
  }

  /**
   * Validates the Http Authorization Request and returns the actors of the Authorization Context.
   *
   * @param request Http Request.
   * @returns Authorization Context.
   */
  public override async validate(request: HttpRequest): Promise<CodeAuthorizationContext> {
    const parameters = <CodeAuthorizationRequest>request.query;

    const authorizationRequest = await super.validate(request);

    const codeChallenge = this.getCodeChallenge(parameters);
    const codeChallengeMethod = this.getCodeChallengeMethod(parameters);

    return { ...authorizationRequest, codeChallenge, codeChallengeMethod };
  }

  /**
   * Retrieves the Code Challenge provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Code Challenge provided by the Client.
   */
  protected getCodeChallenge(parameters: CodeAuthorizationRequest): string {
    if (typeof parameters.code_challenge !== 'string') {
      throw new InvalidRequestException({
        description: 'Invalid parameter "code_challenge".',
        state: parameters.state,
      });
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
    if (parameters.code_challenge_method !== undefined && typeof parameters.code_challenge_method !== 'string') {
      throw new InvalidRequestException({
        description: 'Invalid parameter "code_challenge_method".',
        state: parameters.state,
      });
    }

    const codeChallengeMethodName = parameters.code_challenge_method ?? 'S256';
    const codeChallengeMethod = this.pkces.find((pkceMethod) => pkceMethod.name === codeChallengeMethodName);

    if (codeChallengeMethod === undefined) {
      throw new InvalidRequestException({
        description: `Unsupported code_challenge_method "${codeChallengeMethodName}".`,
        state: parameters.state,
      });
    }

    return codeChallengeMethod;
  }
}
