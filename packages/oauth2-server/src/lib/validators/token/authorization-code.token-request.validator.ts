import { URL } from 'url';

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
import { Logger } from '../../logger/logger';
import { AuthorizationCodeTokenRequest } from '../../requests/token/authorization-code.token-request';
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
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    @Inject(AUTHORIZATION_CODE_SERVICE) private readonly authorizationCodeService: AuthorizationCodeServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[],
  ) {
    super(logger, clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<AuthorizationCodeTokenContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '635bf9a5-ebb3-491f-add5-31d81005e521', {
      request,
    });

    const context = await super.validate(request);

    const { parameters } = context;

    const authorizationCode = await this.getAuthorizationCode(parameters);
    const redirectUri = this.getRedirectUri(parameters, context.client);
    const codeVerifier = this.getCodeVerifier(parameters);

    Object.assign<AuthorizationCodeTokenContext, Partial<AuthorizationCodeTokenContext>>(context, {
      authorizationCode,
      redirectUri,
      codeVerifier,
    });

    this.logger.debug(
      `[${this.constructor.name}] Authorization Code Token Request validation completed`,
      'ca03bd3d-3595-4e46-bc67-4754077d05d0',
      { context },
    );

    return context;
  }

  /**
   * Fetches the requested Authorization Code from the application's storage.
   *
   * @param parameters Parameters of the Token Request.
   * @returns Authorization Code based on the provided Code.
   */
  private async getAuthorizationCode(parameters: AuthorizationCodeTokenRequest): Promise<AuthorizationCode> {
    this.logger.debug(
      `[${this.constructor.name}] Called getAuthorizationCode()`,
      '2e2fc67e-2e19-4875-acaa-474adadc6d89',
      { parameters },
    );

    if (typeof parameters.code === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "code".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "code"`,
        'ac5c085a-1f70-4757-ac7b-a725e23fba7c',
        { parameters },
        exc,
      );

      throw exc;
    }

    const authorizationCode = await this.authorizationCodeService.findOne(parameters.code);

    if (authorizationCode === null) {
      const exc = new InvalidGrantException('Invalid Authorization Code.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Authorization Code`,
        '85c3cca1-15a5-482e-baf5-f5171595c96b',
        null,
        exc,
      );

      throw exc;
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
  protected getRedirectUri(parameters: AuthorizationCodeTokenRequest, client: Client): URL {
    this.logger.debug(`[${this.constructor.name}] Called getRedirectUri()`, '359b88e3-485b-4a1c-8af1-f5bd2cd5a123', {
      parameters,
      client,
    });

    if (typeof parameters.redirect_uri === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "redirect_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "redirect_uri"`,
        '743a7428-a1b8-4184-b815-c334f363a8cd',
        { parameters },
        exc,
      );

      throw exc;
    }

    let redirectUri: URL;

    try {
      redirectUri = new URL(parameters.redirect_uri);
    } catch (exc: unknown) {
      const exception = new InvalidRequestException('Invalid parameter "redirect_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "redirect_uri"`,
        'b12cf04d-1c42-4975-92d0-5d9de931c878',
        { parameters },
        exception,
      );

      throw exception;
    }

    if (redirectUri.hash.length !== 0) {
      const exc = new InvalidRequestException('The Redirect URI MUST NOT have a fragment component.');

      this.logger.error(
        `[${this.constructor.name}] The Redirect URI MUST NOT have a fragment component`,
        'db7a2571-f064-4d4f-9511-b93e80fe4ea8',
        { redirect_uri: redirectUri.href },
        exc,
      );

      throw exc;
    }

    if (!client.redirectUris.includes(redirectUri.href)) {
      const exc = new AccessDeniedException('Invalid Redirect URI.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Redirect URI`,
        '747c1958-b29b-4b34-8ab4-4ca42086b81a',
        { redirect_uri: redirectUri.href, client },
        exc,
      );

      throw exc;
    }

    return redirectUri;
  }

  /**
   * Checks and returns the Code Verifier provided by the Client.
   *
   * @param parameters Parameters of the Token Request.
   * @returns Code Verifier provided by the Client.
   */
  private getCodeVerifier(parameters: AuthorizationCodeTokenRequest): string {
    this.logger.debug(`[${this.constructor.name}] Called getCodeVerifier()`, 'e60c8dcd-1d91-4db1-b251-a821a3e1fff3', {
      parameters,
    });

    if (typeof parameters.code_verifier === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "code_verifier".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "code_verifier"`,
        '9ab35a24-5bb2-4bfc-b980-a6c029b42c73',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.code_verifier;
  }
}
