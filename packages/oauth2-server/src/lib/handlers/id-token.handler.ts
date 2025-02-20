import { Buffer } from 'buffer';
import { createHash } from 'crypto';

import { Inject, Injectable } from '@guarani/di';
import {
  JsonWebEncryption,
  JsonWebEncryptionHeader,
  JsonWebKeySet,
  JsonWebSignature,
  JsonWebSignatureAlgorithm,
  JsonWebSignatureHeader,
} from '@guarani/jose';
import { Nullable } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { Logger } from '../logger/logger';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { IdTokenClaims } from '../tokens/id-token.claims';
import { IdTokenClaimsParameters } from '../tokens/id-token.claims.parameters';
import { UserinfoClaimsParameters } from '../tokens/userinfo.claims.parameters';
import { calculateSubjectIdentifier } from '../utils/calculate-subject-identifier';
import { getClientJsonWebKey } from '../utils/get-client-jsonwebkey';

/**
 * Options for the Generate ID Token functionality.
 */
interface GenerateIdTokenOptions {
  /**
   * Nonce provided by the Client.
   */
  readonly nonce?: string;

  /**
   * Max Age requested by the Client.
   */
  readonly maxAge?: number;
}

/**
 * Handler used to aggregate the operations of the OpenID Connect ID Token.
 */
@Injectable()
export class IdTokenHandler {
  /**
   * Instantiates a new ID Token Handler.
   *
   * @param logger Logger of the Authorization Server.
   * @param jwks JSON Web Key Set of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param userService Instance of the User Service.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly jwks: JsonWebKeySet,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface,
  ) {
    if (typeof this.userService.getUserinfo !== 'function') {
      const exc = new TypeError('Missing implementation of required method "UserServiceInterface.getUserinfo".');

      this.logger.critical(
        `[${this.constructor.name}] Missing implementation of required method "UserServiceInterface.getUserinfo"`,
        '659af5e4-f34b-4c73-8f4f-50f3b6c41f73',
        null,
        exc,
      );

      throw exc;
    }
  }

  /**
   * Generates an ID Token to be used by the Client for authentication purposes.
   *
   * @param login Login containing the currently Authenticated User.
   * @param consent Consent granted by the Authenticated User.
   * @param nonce Nonce provided by the Client.
   * @param maxAge Max Age requested by the Client.
   * @param accessToken Access Token issued to the Client.
   * @param authorizationCode Authorization Code issued to the Client.
   * @returns Generated ID Token.
   */
  public async generateIdToken(
    login: Login,
    consent: Consent,
    accessToken: Nullable<AccessToken>,
    authorizationCode: Nullable<AuthorizationCode>,
    options: GenerateIdTokenOptions = {},
  ): Promise<string> {
    this.logger.debug(`[${this.constructor.name}] Called generateIdToken()`, 'f8f8da4c-a20d-44ee-a97d-b7093f248a88', {
      login,
      consent,
      access_token: accessToken,
      authorization_code: authorizationCode,
      options,
    });

    const now = Math.ceil(Date.now() / 1000);

    const { client, scopes, user } = consent;

    const userinfo = await this.userService.getUserinfo!(user, scopes);

    const signKey = this.jwks.get((jwk) => jwk.alg === client.idTokenSignedResponseAlgorithm && jwk.use === 'sig');

    const jwsHeader = new JsonWebSignatureHeader({
      alg: client.idTokenSignedResponseAlgorithm,
      kid: signKey.kid,
      typ: 'JWT',
    });

    const claims: IdTokenClaimsParameters = Object.assign<IdTokenClaimsParameters, UserinfoClaimsParameters>(
      {
        iss: this.settings.issuer,
        sub: calculateSubjectIdentifier(user, client, this.settings),
        aud: [client.id],
        exp: now + 86400,
        iat: now,
        sid: login.id,
        nonce: options.nonce,
        auth_time: typeof options.maxAge !== 'undefined' ? Math.floor(login.createdAt.getTime() / 1000) : undefined,
        amr: login.amr ?? undefined,
        acr: login.acr ?? undefined,
        azp: client.id,
        at_hash: accessToken !== null ? this.getLeftHash(accessToken.id, jwsHeader.alg) : undefined,
        c_hash: authorizationCode !== null ? this.getLeftHash(authorizationCode.id, jwsHeader.alg) : undefined,
      },
      userinfo,
    );

    const jws = new JsonWebSignature(jwsHeader, new IdTokenClaims(claims).toBuffer());

    const signedJwt = await jws.sign(signKey);

    if (client.idTokenEncryptedResponseKeyWrap === null) {
      this.logger.debug(
        `[${this.constructor.name}] Generated Signed ID Token`,
        '53ba02db-3809-4533-bf0a-fe531afa23f7',
        { jws_header: jwsHeader, claims },
      );

      return signedJwt;
    }

    const keyWrapKey = await getClientJsonWebKey(client, (key) => {
      return (
        key.alg === client.idTokenEncryptedResponseKeyWrap! && (typeof key.use === 'undefined' || key.use === 'enc')
      );
    });

    const jweHeader = new JsonWebEncryptionHeader({
      alg: client.idTokenEncryptedResponseKeyWrap,
      enc: client.idTokenEncryptedResponseContentEncryption!,
      cty: 'JWT',
      kid: keyWrapKey.kid,
    });

    const jwe = new JsonWebEncryption(jweHeader, Buffer.from(signedJwt, 'ascii'));

    const encryptedJwt = await jwe.encrypt(keyWrapKey);

    this.logger.debug(
      `[${this.constructor.name}] Generated Encrypted ID Token`,
      '1c40d3b1-a7a6-4351-a331-00e85cf43041',
      { jws_header: jwsHeader, jwe_header: jweHeader, claims },
    );

    return encryptedJwt;
  }

  /**
   * Checks the provided ID Token and verifies that the currently authenticated User matches the User
   * represented by the ID Token provided by the Client.
   *
   * @param idToken ID Token provided by the Client as a hint to the expected authenticated User.
   * @param client Client of the Request.
   * @param login Login containing the currently Authenticated User.
   * @returns Whether or not the authenticated User matches the User represented by the ID Token.
   */
  public async checkIdTokenHint(idToken: string, client: Client, login: Login): Promise<boolean> {
    this.logger.debug(`[${this.constructor.name}] Called checkIdTokenHint()`, '492bfa48-4c2e-473d-9e74-8ec6982195d8', {
      id_token: idToken,
      client,
      login,
    });

    try {
      const { payload } = await JsonWebSignature.verify(
        idToken,
        async (header) => this.jwks.find((key) => key.kid === header.kid),
        this.settings.idTokenSignatureAlgorithms,
      );

      await IdTokenClaims.parse(payload, {
        ignoreExpired: true,
        validationOptions: {
          iss: { essential: true, value: this.settings.issuer },
          sub: { essential: true, value: calculateSubjectIdentifier(login.user, client, this.settings) },
          aud: { essential: true, values: [client.id, [client.id]] },
          sid: { essential: true, value: login.id },
        },
      });

      this.logger.debug(
        `[${this.constructor.name}] Completed ID Token Hint check`,
        '492bfa48-4c2e-473d-9e74-8ec6982195d8',
        { result: true },
      );

      return true;
    } catch (exc: unknown) {
      this.logger.debug(
        `[${this.constructor.name}] Completed ID Token Hint check`,
        '38262405-94c5-4c0b-88cc-b73ade6f3aed',
        { result: false, exc },
      );

      return false;
    }
  }

  /**
   * Creates a left hash of the provided Identifier.
   *
   * A left hash is created by hashing the provided Identifier with a SHA-2 algorithm based on the provided
   * JSON Web Signature Algorithm (i.e. the algorithm RS256 uses SHA-256), then Base64Url encoding the left-most
   * portion of the hash.
   *
   * @param token Identifier used to create the left hash.
   * @param alg JSON Web Signature Algorithm used to create the ID Token.
   * @returns Base64Url encoded left hash of the provided Identifier.
   */
  private getLeftHash(token: string, alg: JsonWebSignatureAlgorithm): string {
    const hashAlgorithm = `sha${alg.substring(2)}`;
    const hash = createHash(hashAlgorithm).update(token, 'ascii').digest();
    const halfHash = hash.subarray(0, hash.length / 2);

    return halfHash.toString('base64url');
  }
}
