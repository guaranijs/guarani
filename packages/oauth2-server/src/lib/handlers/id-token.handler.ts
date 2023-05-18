import { Inject, Injectable } from '@guarani/di';
import {
  JsonWebKey,
  JsonWebKeySet,
  JsonWebSignature,
  JsonWebSignatureAlgorithm,
  JsonWebSignatureHeader,
  JsonWebTokenClaims,
} from '@guarani/jose';

import { createHash } from 'crypto';

import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { IdTokenClaims } from '../id-token/id-token.claims';
import { IdTokenClaimsParameters } from '../id-token/id-token.claims.parameters';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';

/**
 * Handler used to aggregate the operations of the OpenID Connect ID Token.
 */
@Injectable()
export class IdTokenHandler {
  /**
   * Instantiates a new ID Token Handler.
   *
   * @param jwks JSON Web Key Set of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param userService Instance of the User Service.
   */
  public constructor(
    private readonly jwks: JsonWebKeySet,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface
  ) {
    if (typeof this.userService.getUserinfo !== 'function') {
      throw new TypeError('Missing implementation of required method "UserServiceInterface.getUserinfo".');
    }
  }

  /**
   * Generates an ID Token to be used by the Client for authentication purposes.
   *
   * @param consent Consent granted by the Authenticated User.
   * @param accessToken Access Token issued to the Client.
   * @param authorizationCode Authorization Code issued to the Client.
   * @returns Generated ID Token.
   */
  public async generateIdToken(
    consent: Consent,
    accessToken: AccessToken | null,
    authorizationCode: AuthorizationCode | null,
    additionalClaims: Partial<IdTokenClaimsParameters> = {}
  ): Promise<string> {
    const jwk = this.getJsonWebKey();

    const now = Math.ceil(Date.now() / 1000);

    const { client, scopes, user } = consent;

    const userinfo = await this.userService.getUserinfo!(user, scopes);

    const header = new JsonWebSignatureHeader({ alg: <JsonWebSignatureAlgorithm>jwk.alg, kid: jwk.kid, typ: 'JWT' });
    const claims = new IdTokenClaims({
      iss: this.settings.issuer,
      aud: client.id,
      exp: now + 86400,
      iat: now,
      ...additionalClaims,
      ...userinfo,
    });

    if (accessToken !== null) {
      claims.at_hash = this.getLeftHash(accessToken.handle, header.alg);
    }

    if (authorizationCode !== null) {
      claims.c_hash = this.getLeftHash(authorizationCode.code, header.alg);
    }

    const jws = new JsonWebSignature(header, claims.toBuffer());

    return await jws.sign(jwk);
  }

  /**
   * Checks the provided ID Token and verifies that the currently authenticated User matches the User
   * represented by the ID Token provided by the Client.
   *
   * @param idToken ID Token provided by the Client as a hint to the expected authenticated User.
   * @param login Login containing the currently authenticated User.
   * @returns Whether or not the authenticated User matches the User represented by the ID Token.
   */
  public async checkIdTokenHint(idToken: string, login: Login): Promise<boolean> {
    try {
      const { payload } = await JsonWebSignature.verify(
        idToken,
        async (header) => this.jwks.find((key) => key.kid === header.kid),
        this.settings.idTokenSignatureAlgorithms
      );

      await JsonWebTokenClaims.parse(payload, {
        ignoreExpired: true,
        validationOptions: {
          iss: { essential: true, value: this.settings.issuer },
          sub: { essential: true, value: login.user.id },
          sid: { essential: false, value: login.id },
        },
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets a JSON Web Key suitable for signing an ID Token from the Authorization Server's JSON Web Key Set.
   */
  private getJsonWebKey(): JsonWebKey {
    const jwk = this.jwks.find((jwk) => {
      return (
        jwk.alg !== undefined &&
        jwk.alg !== 'none' &&
        this.settings.idTokenSignatureAlgorithms.includes(<Exclude<JsonWebSignatureAlgorithm, 'none'>>jwk.alg) &&
        jwk.use === 'sig' &&
        (jwk.key_ops === undefined || jwk.key_ops.includes('sign'))
      );
    });

    if (jwk === null) {
      throw new Error('Could not find a JSON Web Key suitable for Signing an ID Token.');
    }

    return jwk;
  }

  /**
   * Creates a left hash of the provided handle.
   *
   * A left hash is created by hashing the provided handle with a SHA-2 algorithm based on the provided
   * JSON Web Signature Algorithm (i.e. the algorithm RS256 uses SHA-256), then Base64Url encoding the left-most
   * portion of the hash.
   *
   * @param token Handle used to create the left hash.
   * @param alg JSON Web Signature Algorithm used to create the ID Token.
   * @returns Base64Url encoded left hash of the provided handle.
   */
  private getLeftHash(token: string, alg: JsonWebSignatureAlgorithm): string {
    const hashAlgorithm = `SHA${alg.substring(2)}`;
    const hash = createHash(hashAlgorithm).update(token, 'ascii').digest();
    const halfHash = hash.subarray(0, hash.length / 2);

    return halfHash.toString('base64url');
  }
}
