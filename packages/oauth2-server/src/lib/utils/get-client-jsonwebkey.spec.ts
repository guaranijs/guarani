import { JsonWebKeyNotFoundException, JsonWebKeySet, OctetSequenceKey } from '@guarani/jose';

import { Client } from '../entities/client.entity';
import { getClientJsonWebKey } from './get-client-jsonwebkey';

describe('getClientJsonWebKey()', () => {
  const jwk = new OctetSequenceKey({ kty: 'oct', k: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' });
  const jwks = new JsonWebKeySet([jwk]).toJSON(true);

  it('should throw when the client has no json web key set registered.', async () => {
    const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
      id: 'client_id',
      jwksUri: null,
      jwks: null,
    });

    await expect(getClientJsonWebKey(client, () => true)).rejects.toThrowWithMessage(
      Error,
      'The Client does not have a JSON Web Key Set registered.',
    );
  });

  it.todo("should throw when no json web key is found at the client's json web key set uri.");

  it.todo("should return a json web key from the client's json web key set uri.");

  it("should throw when no json web key is found at the client's json web key set.", async () => {
    const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
      id: 'client_id',
      jwksUri: null,
      jwks,
    });

    await expect(getClientJsonWebKey(client, () => false)).rejects.toThrow(JsonWebKeyNotFoundException);
  });

  it("should return a json web key from the client's json web key set uri.", async () => {
    const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
      id: 'client_id',
      jwksUri: null,
      jwks,
    });

    await expect(getClientJsonWebKey(client, () => true)).resolves.toMatchObject(jwk.toJSON(true));
  });
});
