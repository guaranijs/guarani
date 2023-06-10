import https from 'https';

import { Injectable } from '@guarani/di';
import {
  InvalidJsonWebKeySetException,
  JsonWebKey,
  JsonWebKeySet,
  JsonWebSignatureAlgorithm,
  JsonWebSignatureHeaderParameters,
} from '@guarani/jose';
import { Nullable } from '@guarani/types';

import { JwtBearerClientAssertion } from '../assertions/jwt-bearer.client-assertion';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { ClientAuthentication } from './client-authentication.type';

/**
 * Implementation of the Private Key JWT Client Authentication Method as described in OpenID Connect Core.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication
 */
@Injectable()
export class PrivateKeyJwtClientAuthentication extends JwtBearerClientAssertion {
  /**
   * JSON Web Signature Algorithms.
   */
  protected readonly algorithms: Exclude<JsonWebSignatureAlgorithm, 'none'>[] = [
    'ES256',
    'ES384',
    'ES512',
    'EdDSA',
    'PS256',
    'PS384',
    'PS512',
    'RS256',
    'RS384',
    'RS512',
  ];

  /**
   * Name of the Client Authentication Method.
   */
  public readonly name: ClientAuthentication = 'private_key_jwt';

  /**
   * Returns the JSON Web Key of the Client used to validate the Client Assertion.
   *
   * @param client Client of the Request.
   * @param header JSON Web Signature Header of the Client Assertion.
   * @returns JSON Web Key of the Client based on the JSON Web Signature Header.
   */
  protected async getClientKey(client: Client, header: JsonWebSignatureHeaderParameters): Promise<JsonWebKey> {
    let clientJwks: Nullable<JsonWebKeySet> = null;

    if (client.jwksUri !== null) {
      clientJwks = await this.getClientJwksFromUri(client.jwksUri);
    } else if (client.jwks !== null) {
      clientJwks = await JsonWebKeySet.load(client.jwks);
    }

    if (clientJwks === null) {
      throw new InvalidClientException(`This Client is not allowed to use the Authentication Method "${this.name}".`);
    }

    const jwk = clientJwks.find((key) => {
      return (
        key.kid === header.kid &&
        (key.key_ops?.includes('verify') ?? true) &&
        (typeof key.use !== 'undefined' ? key.use === 'sig' : true)
      );
    });

    if (jwk === null) {
      throw new InvalidClientException(`This Client is not allowed to use the Authentication Method "${this.name}".`);
    }

    return jwk;
  }

  /**
   * Fetches the JSON Web Key Set of the Client hosted at the provided URI.
   *
   * @param jwksUri URI of the JSON Web Key Set of the Client.
   * @returns JSON Web Key Set of the Client.
   */
  private async getClientJwksFromUri(jwksUri: string): Promise<JsonWebKeySet> {
    return new Promise((resolve, reject) => {
      const request = https.request(jwksUri, (res) => {
        let responseBody = '';

        res.setEncoding('utf8');

        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', async () => {
          try {
            resolve(await JsonWebKeySet.parse(responseBody));
          } catch (exc: unknown) {
            reject(new InvalidJsonWebKeySetException(undefined, { cause: exc }));
          }
        });
      });

      request.on('error', (error) => {
        reject(new InvalidJsonWebKeySetException(undefined, { cause: error }));
      });

      request.end();
    });
  }
}
