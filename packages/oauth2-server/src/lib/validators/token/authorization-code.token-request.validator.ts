import { URL, URLSearchParams } from 'url';

import { Inject, Injectable, InjectAll } from '@guarani/di';

import { AuthorizationCodeTokenContext } from '../../context/token/authorization-code.token-context';
import { AuthorizationCode } from '../../entities/authorization-code.entity';
import { Client } from '../../entities/client.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { HttpRequest } from '../../http/http.request';
import { AuthorizationCodeServiceInterface } from '../../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../../services/authorization-code.service.token';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Implementation of the **Authorization Code** Token Request Validator.
 */
@Injectable()
export class AuthorizationCodeTokenRequestValidator extends TokenRequestValidator<AuthorizationCodeTokenContext> {
  /**
   * Name of the Grant Type that uses this Validator.
   */
  public readonly name: GrantType = 'authorization_code';

  /**
   * Instantiates a new Authorization Code Token Request Validator.
   *
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    @Inject(AUTHORIZATION_CODE_SERVICE) protected readonly authorizationCodeService: AuthorizationCodeServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[]
  ) {
    super(clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<AuthorizationCodeTokenContext> {
    const context = await super.validate(request);

    const { parameters } = context;

    const authorizationCode = await this.getAuthorizationCode(parameters);
    const redirectUri = this.getRedirectUri(parameters, context.client);
    const codeVerifier = this.getCodeVerifier(parameters);

    return { ...context, authorizationCode, redirectUri, codeVerifier };
  }

  /**
   * Fetches the requested Authorization Code from the application's storage.
   *
   * @param parameters Parameters of the Token Request.
   * @returns Authorization Code based on the provided Code.
   */
  private async getAuthorizationCode(parameters: URLSearchParams): Promise<AuthorizationCode> {
    const code = parameters.get('code');

    if (code === null) {
      throw new InvalidRequestException('Invalid parameter "code".');
    }

    const authorizationCode = await this.authorizationCodeService.findOne(code);

    if (authorizationCode === null) {
      throw new InvalidGrantException('Invalid Authorization Code.');
    }

    return authorizationCode;
  }

  /**
   * Parses and validates the Redirect URI provided by the Client.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Parsed and validated Redirect URI.
   */
  protected getRedirectUri(parameters: URLSearchParams, client: Client): URL {
    const redirectUri = parameters.get('redirect_uri');

    if (redirectUri === null) {
      throw new InvalidRequestException('Invalid parameter "redirect_uri".');
    }

    let url: URL;

    try {
      url = new URL(redirectUri);
    } catch (exc: unknown) {
      throw new InvalidRequestException('Invalid parameter "redirect_uri".');
    }

    if (url.hash.length !== 0) {
      throw new InvalidRequestException('The Redirect URI MUST NOT have a fragment component.');
    }

    if (!client.redirectUris.includes(url.href)) {
      throw new AccessDeniedException('Invalid Redirect URI.');
    }

    return url;
  }

  /**
   * Checks and returns the Code Verifier provided by the Client.
   *
   * @param parameters Parameters of the Token Request.
   * @returns Code Verifier provided by the Client.
   */
  private getCodeVerifier(parameters: URLSearchParams): string {
    const codeVerifier = parameters.get('code_verifier');

    if (codeVerifier === null) {
      throw new InvalidRequestException('Invalid parameter "code_verifier".');
    }

    return codeVerifier;
  }
}
