import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { URL } from 'url';

import { Inject, Injectable, InjectAll, Optional } from '@guarani/di';

import { AuthorizationCodeTokenContext } from '../context/token/authorization-code.token-context';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { Logger } from '../logger/logger';
import { PkceInterface } from '../pkces/pkce.interface';
import { PKCE } from '../pkces/pkce.token';
import { Pkce } from '../pkces/pkce.type';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';

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
export class AuthorizationCodeGrantType implements GrantTypeInterface {
  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'authorization_code';

  /**
   * Instantiates a new Authorization Code Grant Type.
   *
   * @param logger Logger of the Authorization Server.
   * @param pkces PKCE Methods.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   * @param idTokenHandler Instance of the ID Token Handler.
   */
  public constructor(
    private readonly logger: Logger,
    @InjectAll(PKCE) private readonly pkces: PkceInterface[],
    @Inject(AUTHORIZATION_CODE_SERVICE) private readonly authorizationCodeService: AuthorizationCodeServiceInterface,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Optional() @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService?: RefreshTokenServiceInterface,
    @Optional() private readonly idTokenHandler?: IdTokenHandler,
  ) {}

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
   * @param context Token Request Context.
   * @returns Access Token Response.
   */
  public async handle(context: AuthorizationCodeTokenContext): Promise<TokenResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '89f3b67e-5ec3-4548-a3a9-880e2a9ebcf4', {
      context,
    });

    const { authorizationCode, client, codeVerifier, redirectUri } = context;

    try {
      this.checkAuthorizationCode(authorizationCode, client, codeVerifier, redirectUri);

      const { consent, login } = authorizationCode;
      const { scopes, user } = consent;

      const accessToken = await this.accessTokenService.create(scopes, client, user);

      const refreshToken =
        typeof this.refreshTokenService !== 'undefined' && client.grantTypes.includes('refresh_token')
          ? await this.refreshTokenService.create(scopes, client, user, accessToken)
          : null;

      const response = createTokenResponse(accessToken, refreshToken);

      if (scopes.includes('openid')) {
        response.id_token = await this.idTokenHandler!.generateIdToken(login, consent, null, null);
      }

      this.logger.debug(
        `[${this.constructor.name}] Authorization Code Grant completed`,
        '88829f8b-6dcf-40a7-a706-36b2f5befe10',
        { response },
      );

      return response;
    } finally {
      this.logger.debug(
        `[${this.constructor.name}] Revoking Authorization Code`,
        '60b8932b-5272-43f5-ae5f-56a90c0852cf',
        { authorization_code: authorizationCode },
      );

      await this.authorizationCodeService.revoke(authorizationCode);
    }
  }

  /**
   * Checks the Authorization Code against the provided data and against the Client of the Token Request.
   *
   * @param authorizationCode Authorization Code to be checked.
   * @param client Client of the Request.
   * @param codeVerifier Code Verifier provided by the Client.
   * @param redirectUri Redirect URI provided by the Client.
   */
  private checkAuthorizationCode(
    authorizationCode: AuthorizationCode,
    client: Client,
    codeVerifier: string,
    redirectUri: URL,
  ): void {
    this.logger.debug(
      `[${this.constructor.name}] Called checkAuthorizationCode()`,
      'a6c7de79-819a-43c0-8aaf-e0a60ca3d6c5',
      {
        authorization_code: authorizationCode,
        client,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri.href,
      },
    );

    const { consent, parameters: authorizationCodeParameters } = authorizationCode;

    const authorizationCodeClientIdBuffer = Buffer.from(consent.client.id, 'utf8');
    const clientIdBuffer = Buffer.from(client.id, 'utf8');

    if (
      authorizationCodeClientIdBuffer.length !== clientIdBuffer.length ||
      !timingSafeEqual(authorizationCodeClientIdBuffer, clientIdBuffer)
    ) {
      const exc = new InvalidGrantException('Mismatching Client Identifier.');

      this.logger.error(
        `[${this.constructor.name}] Mismatching Client Identifier`,
        'ea499ad8-12fe-487e-90fd-79d0209929fa',
        { authorization_code: authorizationCode, client },
        exc,
      );

      throw exc;
    }

    if (new Date() < authorizationCode.validAfter) {
      const exc = new InvalidGrantException('Authorization Code not yet valid.');

      this.logger.error(
        `[${this.constructor.name}] Authorization Code not yet valid`,
        '585bcc3e-d811-42d1-9b87-dbfdc067eff4',
        { authorization_code: authorizationCode },
        exc,
      );

      throw exc;
    }

    if (new Date() > authorizationCode.expiresAt) {
      const exc = new InvalidGrantException('Expired Authorization Code.');

      this.logger.error(
        `[${this.constructor.name}] Expired Authorization Code`,
        'da9d62f5-5dbd-4f74-9140-6e0563966483',
        { authorization_code: authorizationCode },
        exc,
      );

      throw exc;
    }

    if (authorizationCode.isRevoked) {
      const exc = new InvalidGrantException('Revoked Authorization Code.');

      this.logger.error(
        `[${this.constructor.name}] Revoked Authorization Code`,
        '7f88f4ef-a851-4581-8d9f-3429a9f1cc52',
        { authorization_code: authorizationCode },
        exc,
      );

      throw exc;
    }

    const authorizationCodeRedirectUriBuffer = Buffer.from(authorizationCodeParameters.redirect_uri, 'utf8');
    const redirectUriBuffer = Buffer.from(redirectUri.href, 'utf8');

    if (
      authorizationCodeRedirectUriBuffer.length !== redirectUriBuffer.length ||
      !timingSafeEqual(authorizationCodeRedirectUriBuffer, redirectUriBuffer)
    ) {
      const exc = new InvalidGrantException('Mismatching Redirect URI.');

      this.logger.error(
        `[${this.constructor.name}] Mismatching Redirect URI`,
        'c8c89e73-c2c4-4c1b-b56f-c1d530d46ef3',
        { authorization_code: authorizationCode, redirect_uri: redirectUri.href },
        exc,
      );

      throw exc;
    }

    const pkceMethod = this.getPkceMethod(authorizationCodeParameters.code_challenge_method ?? 'plain');

    if (!pkceMethod.verify(authorizationCodeParameters.code_challenge, codeVerifier)) {
      const exc = new InvalidGrantException('Invalid PKCE Code Challenge.');

      this.logger.error(
        `[${this.constructor.name}] Invalid PKCE Code Challenge`,
        '68a9b8cb-2a21-4b11-877a-7cdec78b8092',
        { authorization_code: authorizationCode, code_verifier: codeVerifier },
        exc,
      );

      throw exc;
    }
  }

  /**
   * Retrieves the requested PKCE Method.
   *
   * @param codeChallengeMethod PKCE Method to be retrieved.
   * @returns Instance of the requested PKCE Method.
   */
  private getPkceMethod(codeChallengeMethod: Pkce): PkceInterface {
    return this.pkces.find((pkceMethod) => pkceMethod.name === codeChallengeMethod)!;
  }
}
