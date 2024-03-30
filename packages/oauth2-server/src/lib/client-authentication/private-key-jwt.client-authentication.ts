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
  // TODO: Use getClientJsonWebKey() util function.
  protected async getClientKey(client: Client, header: JsonWebSignatureHeaderParameters): Promise<JsonWebKey> {
    this.logger.debug(`[${this.constructor.name}] Called getClientKey()`, 'e9c016c9-fff6-4625-a96b-40cbaeef45c7', {
      client,
      header,
    });

    let clientJwks: Nullable<JsonWebKeySet> = null;

    if (client.jwksUri !== null) {
      this.logger.debug(
        `[${this.constructor.name}] Loading a JSON Web Key Set from the URI of the Client`,
        '3f9f63ea-3c21-4b4b-97a3-d4b34bec5def',
        { client },
      );

      clientJwks = await this.getClientJwksFromUri(client.jwksUri);
    } else if (client.jwks !== null) {
      this.logger.debug(
        `[${this.constructor.name}] Loading the JSON Web Key Set of the Client`,
        '6f8f34f6-152d-4c14-8c8c-61967d6a6400',
        { client },
      );

      clientJwks = await JsonWebKeySet.load(client.jwks);
    }

    if (clientJwks === null) {
      const exc = new InvalidClientException(
        `This Client is not allowed to use the Authentication Method "${this.name}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Client does not have a JSON Web Key Set`,
        'dfd04cf0-6928-4b88-9ec2-fd4df0c27ddc',
        { client },
        exc,
      );

      throw exc;
    }

    this.logger.debug(
      `[${this.constructor.name}] Searching for a valid JSON Web Key of the Client`,
      '6f8f34f6-152d-4c14-8c8c-61967d6a6400',
      { client, header },
    );

    const jwk = clientJwks.find((key) => {
      return (
        key.kid === header.kid &&
        (key.key_ops?.includes('verify') ?? true) &&
        (typeof key.use !== 'undefined' ? key.use === 'sig' : true)
      );
    });

    if (jwk === null) {
      const exc = new InvalidClientException(
        `This Client is not allowed to use the Authentication Method "${this.name}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Client does not have a JSON Web Key that matches the one on the header`,
        '21446fd7-7159-411f-9086-6177e2ee08aa',
        { client },
        exc,
      );

      throw exc;
    }

    this.logger.debug(`[${this.constructor.name}] Completed getClientKey()`, '63a9025d-7c5a-4a75-ac2c-ccd05300131e', {
      client,
      jwk,
    });

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
