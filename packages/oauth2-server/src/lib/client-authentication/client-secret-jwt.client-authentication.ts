import { Buffer } from 'buffer';

import { Injectable } from '@guarani/di';
import { JsonWebKey, JsonWebSignatureAlgorithm, OctetSequenceKey } from '@guarani/jose';

import { JwtBearerClientAssertion } from '../assertions/jwt-bearer.client-assertion';
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
  protected readonly algorithms: Exclude<JsonWebSignatureAlgorithm, 'none'>[] = ['HS256', 'HS384', 'HS512'];

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
    if (client.secret === null || (client.secretExpiresAt !== null && new Date() >= client.secretExpiresAt)) {
      throw new InvalidClientException(`This Client is not allowed to use the Authentication Method "${this.name}".`);
    }

    return new OctetSequenceKey({ kty: 'oct', k: Buffer.from(client.secret, 'utf8').toString('base64url') });
  }
}
