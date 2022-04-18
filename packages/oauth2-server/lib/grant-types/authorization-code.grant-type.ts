import { Inject, Injectable, InjectAll } from '@guarani/ioc';
import { Optional } from '@guarani/types';

import { AuthorizationCodeEntity } from '../entities/authorization-code.entity';
import { ClientEntity } from '../entities/client.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { Request } from '../http/request';
import { PkceMethod } from '../pkce/pkce-method';
import { SupportedPkceMethod } from '../pkce/types/supported-pkce-method';
import { AccessTokenService } from '../services/access-token.service';
import { AuthorizationCodeService } from '../services/authorization-code.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { AccessTokenResponse } from '../types/access-token.response';
import { createAccessTokenResponse } from '../utils';
import { GrantType } from './grant-type';
import { AuthorizationCodeParameters } from './types/authorization-code.parameters';
import { SupportedGrantType } from './types/supported-grant-type';

/**
 * Implementation of the Authorization Code Grant Type.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1
 *
 * In this Grant Type the Client obtains an Authorization Grant from the End User and exchanges it for an Access Token.
 *
 * This implementation uses PKCE by default, and enforces its use every time.
 */
@Injectable()
export class AuthorizationCodeGrantType implements GrantType {
  /**
   * Name of the Grant Type.
   */
  public readonly name: SupportedGrantType = 'authorization_code';

  /**
   * PKCE Methods.
   */
  private readonly pkceMethods: PkceMethod[];

  /**
   * Instance of the Authorization Code Service.
   */
  private readonly authorizationCodeService: AuthorizationCodeService;

  /**
   * Instance of the Access Token Service.
   */
  private readonly accessTokenService: AccessTokenService;

  /**
   * Instance of the Refresh Token Service.
   */
  private readonly refreshTokenService: RefreshTokenService;

  /**
   * Instantiates a new Authorization Code Grant Type.
   *
   * @param pkceMethods PKCE Methods.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    @InjectAll('PkceMethod') pkceMethods: PkceMethod[],
    @Inject('AuthorizationCodeService') authorizationCodeService: AuthorizationCodeService,
    @Inject('AccessTokenService') accessTokenService: AccessTokenService,
    @Inject('RefreshTokenService') refreshTokenService: RefreshTokenService
  ) {
    if (pkceMethods.length === 0) {
      throw new TypeError('Missing PKCE Methods for Code Response Type.');
    }

    this.pkceMethods = pkceMethods;
    this.authorizationCodeService = authorizationCodeService;
    this.accessTokenService = accessTokenService;
    this.refreshTokenService = refreshTokenService;
  }

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * In this part of the Authorization process the Authorization Server checks the validity of the Authorization Code
   * provided by the Client against the Authorization Code metadata saved at the application's storage.
   *
   * If the Client presented a valid Authorization Code that was granted to itself, and if it presented the correct PKCE
   * Code Verifier that matches the Code Challenge presented at the Authorization Endpoint, then the Provider issues
   * an Access Token and, if allowed to the Client, a Refresh Token.
   *
   * @param request HTTP Request.
   * @param client OAuth 2.0 Client of the Request.
   * @returns Access Token Response.
   */
  public async createTokenResponse(request: Request, client: ClientEntity): Promise<AccessTokenResponse> {
    const params = <AuthorizationCodeParameters>request.body;

    let authorizationCode: Optional<AuthorizationCodeEntity>;

    try {
      this.checkParameters(params);

      authorizationCode = await this.getAuthorizationCode(params.code);

      this.checkAuthorizationCode(authorizationCode, params, client);

      const { scopes, user } = authorizationCode;

      const refreshToken =
        client.grantTypes.includes('refresh_token') && this.refreshTokenService !== undefined
          ? await this.refreshTokenService.createRefreshToken(this.name, scopes, client, user)
          : undefined;

      const accessToken = await this.accessTokenService.createAccessToken(
        this.name,
        scopes,
        client,
        user,
        refreshToken
      );

      return createAccessTokenResponse(accessToken);
    } finally {
      if (authorizationCode !== undefined) {
        await this.authorizationCodeService.revokeAuthorizationCode(authorizationCode);
      }
    }
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param params Parameters of the Token Request.
   */
  private checkParameters(params: AuthorizationCodeParameters): void {
    const { code, code_verifier, redirect_uri } = params;

    if (typeof code !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "code".' });
    }

    if (typeof code_verifier !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "code_verifier".' });
    }

    if (typeof redirect_uri !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "redirect_uri".' });
    }
  }

  /**
   * Fetches the requested Authorization Code from the application's storage.
   *
   * @param code Code provided by the Client.
   * @returns Authorization Code based on the provided Code.
   */
  private async getAuthorizationCode(code: string): Promise<AuthorizationCodeEntity> {
    const authorizationCode = await this.authorizationCodeService.findAuthorizationCode(code);

    if (authorizationCode === undefined) {
      throw new InvalidGrantException({ error_description: 'Invalid Authorization Code.' });
    }

    return authorizationCode;
  }

  /**
   * Checks the Authorization Code against the provided data and against the Client of the Token Request.
   *
   * @param authorizationCode Authorization Code to be checked.
   * @param params Parameters of the Token Request.
   * @param client Client of the Request.
   */
  private checkAuthorizationCode(
    authorizationCode: AuthorizationCodeEntity,
    params: AuthorizationCodeParameters,
    client: ClientEntity
  ): void {
    if (authorizationCode.client.id !== client.id) {
      throw new InvalidGrantException({ error_description: 'Mismatching Client Identifier.' });
    }

    if (new Date() > authorizationCode.expiresAt) {
      throw new InvalidGrantException({ error_description: 'Expired Authorization Code.' });
    }

    if (authorizationCode.isRevoked) {
      throw new InvalidGrantException({ error_description: 'Invalid Authorization Code.' });
    }

    if (authorizationCode.redirectUri.href !== params.redirect_uri) {
      throw new InvalidGrantException({ error_description: 'Mismatching Redirect URI.' });
    }

    const pkceMethod = this.getPkceMethod(authorizationCode.codeChallengeMethod ?? 'plain');

    if (!pkceMethod.verify(authorizationCode.codeChallenge, params.code_verifier)) {
      throw new InvalidGrantException({ error_description: 'Invalid Authorization Code.' });
    }
  }

  /**
   * Retrieves the requested PKCE Method.
   *
   * @param codeChallengeMethod PKCE Method to be retrieved.
   * @returns Instance of the requested PKCE Method.
   */
  private getPkceMethod(codeChallengeMethod: SupportedPkceMethod): PkceMethod {
    const pkceMethod = this.pkceMethods.find((pkceMethod) => pkceMethod.name === codeChallengeMethod);

    if (pkceMethod === undefined) {
      throw new InvalidRequestException({ error_description: `Unsupported PKCE Method "${codeChallengeMethod}".` });
    }

    return pkceMethod;
  }
}
