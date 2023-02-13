import { JsonWebKey, JsonWebKeyType, JsonWebSignatureAlgorithm } from '@guarani/jose';
import { Injectable } from '@guarani/di';

import { Buffer } from 'buffer';

import { JwtBearerClientAssertion } from '../assertions/client-authentication/jwt-bearer.client-assertion';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { ClientAuthentication } from './client-authentication.type';

/**
 * Implementation of the Client Secret JWT Client Authentication Method as described in OpenID Connect Core.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
 */
@Injectable()
export class ClientSecretJwtClientAuthentication extends JwtBearerClientAssertion {
  /**
   * JSON Web Signature Algorithms.
   */
  protected readonly algorithms: JsonWebSignatureAlgorithm[] = [
    JsonWebSignatureAlgorithm.HS256,
    JsonWebSignatureAlgorithm.HS384,
    JsonWebSignatureAlgorithm.HS512,
  ];

  /**
   * Name of the Client Authentication Method.
   */
  public readonly name: ClientAuthentication = 'client_secret_jwt';

  /**
   * Returns the Secret of the Client as a JSON Web Key to validate the Client Assertion.
   *
   * @param client Client of the Request.
   * @returns Secret of the Client as a JSON Web Key.
   */
  protected async getClientKey(client: Client): Promise<JsonWebKey> {
    if (client.secret == null || (client.secretExpiresAt != null && new Date() >= client.secretExpiresAt)) {
      throw new InvalidClientException({
        description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      });
    }

    return new JsonWebKey({ kty: JsonWebKeyType.Octet, k: Buffer.from(client.secret, 'utf8').toString('base64url') });
  }
}
