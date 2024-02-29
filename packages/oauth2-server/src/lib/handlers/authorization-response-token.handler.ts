import { Buffer } from 'buffer';

import { Inject, Injectable } from '@guarani/di';
import {
  JsonWebEncryption,
  JsonWebEncryptionHeader,
  JsonWebKeySet,
  JsonWebSignature,
  JsonWebSignatureHeader,
} from '@guarani/jose';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { AuthorizationResponseTokenClaims } from '../tokens/authorization-response-token.claims';
import { AuthorizationResponseTokenClaimsParameters } from '../tokens/authorization-response-token.claims.parameters';
import { getClientJsonWebKey } from '../utils/get-client-jsonwebkey';

/**
 * Handler used to aggregate the operations of the Authorization Response Token.
 */
@Injectable()
export class AuthorizationResponseTokenHandler {
  /**
   * Instantiates a new Authorization Response Token Handler.
   *
   * @param jwks JSON Web Key Set of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly jwks: JsonWebKeySet,
    @Inject(SETTINGS) private readonly settings: Settings,
  ) {}

  /**
   * Generates a Authorization Response Token to be used by the Client for authorization purposes.
   *
   * @param context Context of the Authorization Request.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns Generated Authorization Response Token.
   */
  public async generateAuthorizationResponseToken(
    context: AuthorizationContext,
    parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
  ): Promise<string> {
    const now = Math.ceil(Date.now() / 1000);

    const { client } = context;

    const signKey = this.jwks.get((jwk) => {
      return jwk.alg === client.authorizationSignedResponseAlgorithm && jwk.use === 'sig';
    });

    const jwsHeader = new JsonWebSignatureHeader({
      alg: client.authorizationSignedResponseAlgorithm!,
      kid: signKey.kid,
      typ: 'JWT',
    });

    const claims: AuthorizationResponseTokenClaimsParameters = {
      iss: this.settings.issuer,
      aud: [client.id],
      exp: now + 86400,
      iat: now,
      ...parameters,
    };

    const jws = new JsonWebSignature(jwsHeader, new AuthorizationResponseTokenClaims(claims).toBuffer());

    const signedJwt = await jws.sign(signKey);

    if (client.authorizationEncryptedResponseKeyWrap === null) {
      return signedJwt;
    }

    const keyWrapKey = await getClientJsonWebKey(client, (key) => {
      return (
        key.alg === client.authorizationEncryptedResponseKeyWrap! &&
        (typeof key.use === 'undefined' || key.use === 'enc')
      );
    });

    const jweHeader = new JsonWebEncryptionHeader({
      alg: client.authorizationEncryptedResponseKeyWrap,
      enc: client.authorizationEncryptedResponseContentEncryption!,
      cty: 'JWT',
      kid: keyWrapKey.kid,
    });

    const jwe = new JsonWebEncryption(jweHeader, Buffer.from(signedJwt, 'ascii'));

    return await jwe.encrypt(keyWrapKey);
  }
}
