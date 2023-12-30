import { Inject, Injectable } from '@guarani/di';
import {
  JsonWebEncryption,
  JsonWebEncryptionHeader,
  JsonWebKeySet,
  JsonWebSignature,
  JsonWebSignatureHeader,
} from '@guarani/jose';
import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { Login } from '../entities/login.entity';
import { User } from '../entities/user.entity';
import { LogoutTokenClaims } from '../logout-token/logout-token.claims';
import { LogoutTokenClaimsParameters } from '../logout-token/logout-token.claims.parameters';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { calculateSubjectIdentifier } from '../utils/calculate-subject-identifier';
import { getClientJsonWebKey } from '../utils/get-client-jsonwebkey';

/**
 * Handler used to aggregate the operations of the OpenID Connect Logout Token.
 */
@Injectable()
export class LogoutTokenHandler {
  /**
   * Instantiates a new Logout Token Handler.
   *
   * @param jwks JSON Web Key Set of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly jwks: JsonWebKeySet,
    @Inject(SETTINGS) private readonly settings: Settings,
  ) {}

  /**
   * Generates a Logout Token used to communicate the Client of the Logout of the User.
   *
   * @param client Client of the Request.
   * @param user User being logged out.
   * @param login Login being destroyed
   * @returns Generated Logout Token.
   */
  public async generateLogoutToken(client: Client, user: Nullable<User>, login: Nullable<Login>): Promise<string> {
    if (user === null && login === null) {
      throw new TypeError('You must provide at least one of "user" and "login".');
    }

    const signKey = this.jwks.get((jwk) => jwk.alg === client.idTokenSignedResponseAlgorithm && jwk.use === 'sig');

    const jwsHeader = new JsonWebSignatureHeader({
      alg: client.idTokenSignedResponseAlgorithm,
      kid: signKey.kid,
      typ: 'logout+jwt',
    });

    const claims: LogoutTokenClaimsParameters = {
      iss: this.settings.issuer,
      sub: user !== null ? calculateSubjectIdentifier(user, client, this.settings) : undefined,
      aud: [client.id],
      iat: Math.ceil(Date.now() / 1000),
      events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
      sid: login?.id,
    };

    const jws = new JsonWebSignature(jwsHeader, new LogoutTokenClaims(claims).toBuffer());

    const signedJwt = await jws.sign(signKey);

    if (client.idTokenEncryptedResponseKeyWrap === null) {
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

    return await jwe.encrypt(keyWrapKey);
  }
}
