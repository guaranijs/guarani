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
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param jwks JSON Web Key Set of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
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
    this.logger.debug(
      `[${this.constructor.name}] Called generateAuthorizationResponseToken()`,
      '0e9941af-e67c-4d47-af0d-647012776dd8',
      { context, parameters },
    );

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
      this.logger.debug(
        `[${this.constructor.name}] Generated Signed Authorization Response Token`,
        '232cfeb6-5738-4dc8-ba38-a739c9e8098b',
        { jws_header: jwsHeader, claims },
      );

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

    const encryptedJwt = await jwe.encrypt(keyWrapKey);

    this.logger.debug(
      `[${this.constructor.name}] Generated Encrypted Authorization Response Token`,
      'b92fed81-2913-4aae-a698-344a2720cbc9',
      { jws_header: jwsHeader, jwe_header: jweHeader, claims },
    );

    return encryptedJwt;
  }
}
