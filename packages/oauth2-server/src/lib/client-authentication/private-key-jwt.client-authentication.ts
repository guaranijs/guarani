import { Injectable } from '@guarani/di';
import {
  JsonWebSignatureAlgorithm,
  JsonWebKey,
  JsonWebSignatureHeaderParameters,
  JsonWebKeySet,
  InvalidJsonWebKeySetException,
} from '@guarani/jose';

import https from 'https';

import { JwtBearerClientAssertion } from '../assertions/client-authentication/jwt-bearer.client-assertion';
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
  protected readonly algorithms: JsonWebSignatureAlgorithm[] = [
    'ES256',
    'ES384',
    'ES512',
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
    let clientJwks: JsonWebKeySet | null = null;

    if (client.jwksUri != null) {
      clientJwks = await this.getClientJwksFromUri(client.jwksUri);
    } else if (client.jwks != null) {
      clientJwks = JsonWebKeySet.load(client.jwks);
    }

    if (clientJwks === null) {
      throw new InvalidClientException({
        description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      });
    }

    const jwk = clientJwks.find((key) => {
      return (
        key.kid === header.kid &&
        (key.key_ops?.includes('verify') ?? true) &&
        (key.use !== undefined ? key.use === 'sig' : true)
      );
    });

    if (jwk === null) {
      throw new InvalidClientException({
        description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      });
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
        res.on('end', () => {
          try {
            resolve(JsonWebKeySet.parse(responseBody));
          } catch (exc: unknown) {
            const exception = new InvalidJsonWebKeySetException();
            exception.cause = exc;

            reject(exception);
          }
        });
      });

      request.on('error', (error) => {
        const exception = new InvalidJsonWebKeySetException();
        exception.cause = error;

        reject(exception);
      });

      request.end();
    });
  }
}
