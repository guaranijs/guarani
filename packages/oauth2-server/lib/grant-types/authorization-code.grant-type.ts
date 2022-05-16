import { Inject, Injectable, InjectAll } from '@guarani/di';
import { Optional } from '@guarani/types';

import { AuthorizationCode } from '../entities/authorization-code';
import { Client } from '../entities/client';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { AuthorizationCodeTokenParameters } from '../models/authorization-code.token-parameters';
import { TokenResponse } from '../models/token-response';
import { IPkceMethod } from '../pkce/pkce-method.interface';
import { IAccessTokenService } from '../services/access-token.service.interface';
import { IAuthorizationCodeService } from '../services/authorization-code.service.interface';
import { IRefreshTokenService } from '../services/refresh-token.service.interface';
import { GrantType } from '../types/grant-type';
import { PkceMethod } from '../types/pkce-method';
import { createTokenResponse } from '../utils/create-token-response';
import { IGrantType } from './grant-type.interface';

/**
 * Implementation of the **Authorization Code** Grant Type.
 *
 * In this Grant Type the Client obtains an Authorization Grant from the End User and exchanges it for an Access Token.
 *
 * This implementation uses PKCE by default, and enforces its use every time.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1
 */
@Injectable()
export class AuthorizationCodeGrantType implements IGrantType {
  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'authorization_code';

  /**
   * Instantiates a new Authorization Code Grant Type.
   *
   * @param pkceMethods PKCE Methods.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    @InjectAll('PkceMethod') private readonly pkceMethods: IPkceMethod[],
    @Inject('AuthorizationCodeService') private readonly authorizationCodeService: IAuthorizationCodeService,
    @Inject('AccessTokenService') private readonly accessTokenService: IAccessTokenService,
    @Inject('RefreshTokenService', true) private readonly refreshTokenService?: Optional<IRefreshTokenService>
  ) {
    if (this.pkceMethods.length === 0) {
      throw new TypeError('Missing PKCE Methods for Authorization Code Grant Type.');
    }
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
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Access Token Response.
   */
  public async handle(parameters: AuthorizationCodeTokenParameters, client: Client): Promise<TokenResponse> {
    this.checkParameters(parameters);

    const authorizationCode = await this.getAuthorizationCode(parameters.code);

    try {
      this.checkAuthorizationCode(authorizationCode, parameters, client);

      const { scopes, user } = authorizationCode;

      const accessToken = await this.accessTokenService.createAccessToken(scopes, client, user);

      const refreshToken =
        this.refreshTokenService !== undefined && client.grantTypes.includes('refresh_token')
          ? await this.refreshTokenService.createRefreshToken(scopes, client, user)
          : undefined;

      return createTokenResponse(accessToken, refreshToken);
    } finally {
      await this.authorizationCodeService.revokeAuthorizationCode(authorizationCode);
    }
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param parameters Parameters of the Token Request.
   */
  private checkParameters(parameters: AuthorizationCodeTokenParameters): void {
    const { code, code_verifier, redirect_uri } = parameters;

    if (typeof code !== 'string') {
      throw new InvalidRequestException('Invalid parameter "code".');
    }

    if (typeof code_verifier !== 'string') {
      throw new InvalidRequestException('Invalid parameter "code_verifier".');
    }

    if (typeof redirect_uri !== 'string') {
      throw new InvalidRequestException('Invalid parameter "redirect_uri".');
    }
  }

  /**
   * Fetches the requested Authorization Code from the application's storage.
   *
   * @param code Code provided by the Client.
   * @returns Authorization Code based on the provided Code.
   */
  private async getAuthorizationCode(code: string): Promise<AuthorizationCode> {
    const authorizationCode = await this.authorizationCodeService.findAuthorizationCode(code);

    if (authorizationCode === undefined) {
      throw new InvalidGrantException('Invalid Authorization Code.');
    }

    return authorizationCode;
  }

  /**
   * Checks the Authorization Code against the provided data and against the Client of the Token Request.
   *
   * @param authorizationCode Authorization Code to be checked.
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   */
  private checkAuthorizationCode(
    authorizationCode: AuthorizationCode,
    parameters: AuthorizationCodeTokenParameters,
    client: Client
  ): void {
    if (authorizationCode.client.id !== client.id) {
      throw new InvalidGrantException('Mismatching Client Identifier.');
    }

    if (new Date() < authorizationCode.validAfter) {
      throw new InvalidGrantException('Authorization Code not yet valid.');
    }

    if (new Date() > authorizationCode.expiresAt) {
      throw new InvalidGrantException('Expired Authorization Code.');
    }

    if (authorizationCode.isRevoked) {
      throw new InvalidGrantException('Revoked Authorization Code.');
    }

    if (authorizationCode.redirectUri !== parameters.redirect_uri) {
      throw new InvalidGrantException('Mismatching Redirect URI.');
    }

    const pkceMethod = this.getPkceMethod(authorizationCode.codeChallengeMethod ?? 'plain');

    if (!pkceMethod.verify(authorizationCode.codeChallenge, parameters.code_verifier)) {
      throw new InvalidGrantException('Invalid PKCE Code Challenge.');
    }
  }

  /**
   * Retrieves the requested PKCE Method.
   *
   * @param codeChallengeMethod PKCE Method to be retrieved.
   * @returns Instance of the requested PKCE Method.
   */
  private getPkceMethod(codeChallengeMethod: PkceMethod): IPkceMethod {
    const pkceMethod = this.pkceMethods.find((pkceMethod) => pkceMethod.name === codeChallengeMethod);

    if (pkceMethod === undefined) {
      throw new InvalidRequestException(`Unsupported PKCE Method "${codeChallengeMethod}".`);
    }

    return pkceMethod;
  }
}
