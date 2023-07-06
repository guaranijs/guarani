import https from 'https';

import { JsonWebKey, JsonWebKeyNotFoundException, JsonWebKeyParameters, JsonWebKeySet } from '@guarani/jose';
import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';

/**
 * Fetches the JSON Web Key Set of the Client hosted at the provided URI.
 *
 * @param jwksUri URI of the JSON Web Key Set of the Client.
 * @returns JSON Web Key Set of the Client.
 */
function getClientJwksFromUri(jwksUri: string): Promise<JsonWebKeySet> {
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

/**
 * Gets a JSON Web Key from the Client's JSON Web Key Set.
 *
 * @param client Client requesting authorization.
 * @param predicate Function used to select a JSON Web Key.
 * @returns JSON Web Key.
 */
export async function getClientJsonWebKey(
  client: Client,
  predicate: (key: JsonWebKeyParameters) => boolean
): Promise<JsonWebKey> {
  let clientJwks: Nullable<JsonWebKeySet> = null;

  if (client.jwksUri !== null) {
    clientJwks = await getClientJwksFromUri(client.jwksUri);
  } else if (client.jwks !== null) {
    clientJwks = await JsonWebKeySet.load(client.jwks);
  }

  if (clientJwks === null) {
    throw new Error('The Client does not have a JSON Web Key Set registered.');
  }

  const jwk = clientJwks.find(predicate);

  if (jwk === null) {
    throw new JsonWebKeyNotFoundException();
  }

  return jwk;
}
