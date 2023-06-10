import { Buffer } from 'buffer';
import { createHash } from 'crypto';
import https from 'https';

import { Inject, Injectable } from '@guarani/di';
import {
  JsonWebEncryption,
  JsonWebEncryptionHeader,
  JsonWebKey,
  JsonWebKeySet,
  JsonWebSignature,
  JsonWebSignatureAlgorithm,
  JsonWebSignatureHeader,
  JsonWebTokenClaims,
} from '@guarani/jose';
import { Nullable } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { IdTokenClaims } from '../id-token/id-token.claims';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { calculateSubjectIdentifier } from '../utils/calculate-subject-identifier';

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
   * @param parameters Parameters of the Authorization Request.
   * @param login Login containing the currently Authenticated User.
   * @param consent Consent granted by the Authenticated User.
   * @param accessToken Access Token issued to the Client.
   * @param authorizationCode Authorization Code issued to the Client.
   * @returns Generated ID Token.
   */
  public async generateIdToken(
    parameters: AuthorizationRequest,
    login: Login,
    consent: Consent,
    accessToken: Nullable<AccessToken>,
    authorizationCode: Nullable<AuthorizationCode>
  ): Promise<string> {
    const now = Math.ceil(Date.now() / 1000);

    const { client, scopes, user } = consent;

    const userinfo = await this.userService.getUserinfo!(user, scopes);

    const signKey = this.getSigningJsonWebKey(client);

    const jwsHeader = new JsonWebSignatureHeader({
      alg: client.idTokenSignedResponseAlgorithm,
      kid: signKey.kid,
      typ: 'JWT',
    });

    const claims = new IdTokenClaims({
      iss: this.settings.issuer,
      sub: calculateSubjectIdentifier(user, client, this.settings),
      aud: [client.id],
      exp: now + 86400,
      iat: now,
      sid: login.id,
      nonce: parameters.nonce,
      auth_time: typeof parameters.max_age !== 'undefined' ? Math.floor(login.createdAt.getTime() / 1000) : undefined,
      amr: login.amr ?? undefined,
      acr: login.acr ?? undefined,
      azp: client.id,
      at_hash: accessToken !== null ? this.getLeftHash(accessToken.handle, jwsHeader.alg) : undefined,
      c_hash: authorizationCode !== null ? this.getLeftHash(authorizationCode.code, jwsHeader.alg) : undefined,
      ...userinfo,
    });

    const jws = new JsonWebSignature(jwsHeader, claims.toBuffer());

    const signedJwt = await jws.sign(signKey);

    if (client.idTokenEncryptedResponseKeyWrap === null) {
      return signedJwt;
    }

    const keyWrapKey = await this.getKeyWrapJsonWebKey(client);

    const jweHeader = new JsonWebEncryptionHeader({
      alg: client.idTokenEncryptedResponseKeyWrap,
      enc: client.idTokenEncryptedResponseContentEncryption!,
      cty: 'JWT',
      kid: keyWrapKey.kid,
    });

    const jwe = new JsonWebEncryption(jweHeader, Buffer.from(signedJwt, 'ascii'));

    return await jwe.encrypt(keyWrapKey);
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
          sub: { essential: true, value: calculateSubjectIdentifier(login.user, client, this.settings) },
          aud: { essential: true, values: [client.id, [client.id]] },
          sid: { essential: false, value: login.id },
        },
      });

      return true;
    } catch {
      return false;
    }
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
    const hashAlgorithm = `sha${alg.substring(2)}`;
    const hash = createHash(hashAlgorithm).update(token, 'ascii').digest();
    const halfHash = hash.subarray(0, hash.length / 2);

    return halfHash.toString('base64url');
  }

  /**
   * Gets a JSON Web Key suitable for signing an ID Token from the Authorization Server's JSON Web Key Set.
   *
   * @param client Client requesting authorization.
   * @returns JSON Web Key used to sign the ID Token.
   */
  private getSigningJsonWebKey(client: Client): JsonWebKey {
    const jwk = this.jwks.find((jwk) => jwk.alg === client.idTokenSignedResponseAlgorithm && jwk.use === 'sig');

    if (jwk === null) {
      throw new Error('Could not find a JSON Web Key suitable for Signing an ID Token.');
    }

    return jwk;
  }

  /**
   * Gets a JSON Web Key suitable for signing an ID Token from the Authorization Server's JSON Web Key Set.
   *
   * @param client Client requesting authorization.
   * @returns JSON Web Key used to sign the ID Token.
   */
  private async getKeyWrapJsonWebKey(client: Client): Promise<JsonWebKey> {
    let clientJwks: Nullable<JsonWebKeySet> = null;

    if (client.jwksUri !== null) {
      clientJwks = await this.getClientJwksFromUri(client.jwksUri);
    } else if (client.jwks !== null) {
      clientJwks = await JsonWebKeySet.load(client.jwks);
    }

    if (clientJwks === null) {
      throw new Error('The Client does not have a JSON Web Key Set registered.');
    }

    const jwk = clientJwks.find((key) => {
      return (
        key.alg === client.idTokenEncryptedResponseKeyWrap! && (typeof key.use === 'undefined' || key.use === 'enc')
      );
    });

    if (jwk === null) {
      throw new Error('Could not find a JSON Web Key suitable for Encrypting an ID Token.');
    }

    return jwk;
  }

  /**
   * Fetches the JSON Web Key Set of the Client hosted at the provided URI.
   *
   * @param jwksUri URI of the JSON Web Key Set of the Client.
   * @returns JSON Web Key Set of the Client.
   */
  private getClientJwksFromUri(jwksUri: string): Promise<JsonWebKeySet> {
    return new Promise((resolve, reject) => {
      const request = https.request(jwksUri, (res) => {
        let responseBody = '';

        res.setEncoding('utf8');

        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', async () => {
          try {
            resolve(await JsonWebKeySet.parse(responseBody));
          } catch (exc: unknown) {
            reject(new Error('Could not load the JSON Web Key Set of the Client.', { cause: exc }));
          }
        });
      });

      request.on('error', (error) => {
        reject(new Error('Could not load the JSON Web Key Set of the Client.', { cause: error }));
      });

      request.end();
    });
  }
}
