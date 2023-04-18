import { Inject, Injectable, InjectAll, Optional } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { URL } from 'url';

import { AuthorizationCodeTokenContext } from '../context/token/authorization-code.token.context';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
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
   * @param pkces PKCE Methods.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   * @param idTokenHandler Instance of the ID Token Handler.
   */
  public constructor(
    @InjectAll(PKCE) private readonly pkces: PkceInterface[],
    @Inject(AUTHORIZATION_CODE_SERVICE) private readonly authorizationCodeService: AuthorizationCodeServiceInterface,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Optional() @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService?: RefreshTokenServiceInterface,
    @Optional() private readonly idTokenHandler?: IdTokenHandler
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
    const { authorizationCode, client, codeVerifier, redirectUri } = context;

    try {
      this.checkAuthorizationCode(authorizationCode, client, codeVerifier, redirectUri);

      const { consent, parameters, session } = authorizationCode;
      const { scopes, user } = consent;

      const accessToken = await this.accessTokenService.create(scopes, client, user);

      const refreshToken = client.grantTypes.includes('refresh_token')
        ? await this.refreshTokenService?.create(scopes, client, user, accessToken)
        : undefined;

      const response = createTokenResponse(accessToken, refreshToken);

      if (scopes.includes('openid')) {
        response.id_token = await this.idTokenHandler!.generateIdToken(consent, null, null, {
          nonce: parameters.nonce,
          auth_time: parameters.max_age !== undefined ? Math.floor(session.createdAt.getTime() / 1000) : undefined,
          amr: session.amr ?? undefined,
          acr: session.acr ?? undefined,
        });
      }

      return removeUndefined(response);
    } finally {
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
    redirectUri: URL
  ): void {
    const { consent, parameters: authorizationCodeParameters } = authorizationCode;

    const authorizationCodeClientIdBuffer = Buffer.from(consent.client.id, 'utf8');
    const clientIdBuffer = Buffer.from(client.id, 'utf8');

    if (
      authorizationCodeClientIdBuffer.length !== clientIdBuffer.length ||
      !timingSafeEqual(authorizationCodeClientIdBuffer, clientIdBuffer)
    ) {
      throw new InvalidGrantException({ description: 'Mismatching Client Identifier.' });
    }

    if (new Date() < authorizationCode.validAfter) {
      throw new InvalidGrantException({ description: 'Authorization Code not yet valid.' });
    }

    if (new Date() > authorizationCode.expiresAt) {
      throw new InvalidGrantException({ description: 'Expired Authorization Code.' });
    }

    if (authorizationCode.isRevoked) {
      throw new InvalidGrantException({ description: 'Revoked Authorization Code.' });
    }

    const authorizationCodeRedirectUriBuffer = Buffer.from(authorizationCodeParameters.redirect_uri, 'utf8');
    const redirectUriBuffer = Buffer.from(redirectUri.href, 'utf8');

    if (
      authorizationCodeRedirectUriBuffer.length !== redirectUriBuffer.length ||
      !timingSafeEqual(authorizationCodeRedirectUriBuffer, redirectUriBuffer)
    ) {
      throw new InvalidGrantException({ description: 'Mismatching Redirect URI.' });
    }

    const pkceMethod = this.getPkceMethod(authorizationCodeParameters.code_challenge_method ?? 'plain');

    if (!pkceMethod.verify(authorizationCodeParameters.code_challenge, codeVerifier)) {
      throw new InvalidGrantException({ description: 'Invalid PKCE Code Challenge.' });
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
