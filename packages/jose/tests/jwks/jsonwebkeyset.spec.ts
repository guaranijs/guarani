import { InvalidJsonWebKeySetException } from '../../lib/exceptions/invalid-json-web-key-set.exception';
import { JsonWebKeyNotFoundException } from '../../lib/exceptions/json-web-key-not-found.exception';
import { EcKey } from '../../lib/jwk/algorithms/ec/ec.key';
import { OctKey } from '../../lib/jwk/algorithms/oct/oct.key';
import { RsaKey } from '../../lib/jwk/algorithms/rsa/rsa.key';
import { JsonWebKey } from '../../lib/jwk/jsonwebkey';
import { JsonWebKeyParams } from '../../lib/jwk/jsonwebkey.params';
import { JsonWebKeySet } from '../../lib/jwks/jsonwebkeyset';
import { JsonWebKeySetParams } from '../../lib/jwks/jsonwebkeyset.params';
import { loadJwkEllipticCurveKey } from '../keys/ec/load-elliptic-curve-key';
import { loadJwkOctetSequenceKey } from '../keys/oct/load-octet-sequence-key';
import { loadJwkRsaKey } from '../keys/rsa/load-rsa-key';

const invalidJwkCollections: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  'foo',
  Buffer.alloc(0),
  Symbol.for('foo'),
  () => {},
  {},
  [],
  ['foo'],
];

const jwkCollectionWithRepeatedKeyIdentifiers: JsonWebKey[] = [
  new EcKey(loadJwkEllipticCurveKey('public'), { kid: 'static-id' }),
  new OctKey(loadJwkOctetSequenceKey(), { kid: 'static-id' }),
  new RsaKey(loadJwkRsaKey('public'), { kid: 'static-id' }),
];

const invalidParams: any[] = [undefined, null, true, 1, 1.2, 1n, '', Buffer.alloc(0), Symbol.for(''), () => {}, []];

const invalidKeysParams: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  '',
  Buffer.alloc(0),
  Symbol.for(''),
  () => {},
  {},
  [],
  [123],
  [{ kty: () => {} }],
];

const keys: JsonWebKey[] = [
  new EcKey(loadJwkEllipticCurveKey('public'), { kid: 'eckey' }),
  new OctKey(loadJwkOctetSequenceKey(), { kid: 'octkey' }),
  new RsaKey(loadJwkRsaKey('public'), { kid: 'rsakey' }),
];

describe('JSON Web Key Set', () => {
  describe('constructor', () => {
    it.each(invalidJwkCollections)('should reject an invalid collection of JSON Web Keys.', (invalidJwkCollection) => {
      expect(() => new JsonWebKeySet(invalidJwkCollection)).toThrow(TypeError);
    });

    it('should reject a collection containing a JSON Web Key without a Key Identifier.', () => {
      expect(() => new JsonWebKeySet([new RsaKey(loadJwkRsaKey('public'))])).toThrow(InvalidJsonWebKeySetException);
    });

    it('should reject a collection containing JSON Web Keys with duplicated Key Identifiers.', () => {
      expect(() => new JsonWebKeySet(jwkCollectionWithRepeatedKeyIdentifiers)).toThrow(InvalidJsonWebKeySetException);
    });
  });

  describe('load', () => {
    it.each(invalidParams)('should reject an invalid "params".', (invalidParam) => {
      expect(() => JsonWebKeySet.load(invalidParam)).toThrow(TypeError);
    });

    it.each(invalidKeysParams)('should reject an invalid "keys" JSON Web Key Set Parameter.', (invalidKeysParam) => {
      expect(() => JsonWebKeySet.load({ keys: invalidKeysParam })).toThrow(TypeError);
    });

    it('should create a JSON Web Key Set based on valid parameters.', () => {
      const params: JsonWebKeySetParams = { keys: [{ ...loadJwkOctetSequenceKey(), kid: 'foo' }] };

      expect(() => JsonWebKeySet.load(params)).not.toThrow();

      expect(JsonWebKeySet.load(params)).toMatchObject(params);
    });
  });

  describe('parse', () => {
    it('should parse a JSON encoded JSON Web Key Set.', () => {
      const params: JsonWebKeySetParams = { keys: [{ ...loadJwkOctetSequenceKey(), kid: 'foo' }] };
      const jsonEncoded = '{"keys":[{"kty":"oct","k":"qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ","kid":"foo"}]}';

      expect(() => JsonWebKeySet.parse(jsonEncoded)).not.toThrow();
      expect(JsonWebKeySet.parse(jsonEncoded)).toMatchObject(params);
    });
  });

  describe('getKeyOrNone', () => {
    const keyset = new JsonWebKeySet(keys);

    it.each<JsonWebKeyParams>([{ kid: 'unknown' }, { kty: 'oct', kid: 'rsakey' }])(
      'should return undefined when a key with the provided parameters is not found.',
      (invalidKeyParams) => expect(keyset.getKeyOrNone(invalidKeyParams)).toBeUndefined()
    );

    it('should return a JSON Web Key instance that matches the requested parameters.', () => {
      expect(keyset.getKeyOrNone({ kid: 'octkey' })).toMatchObject(loadJwkOctetSequenceKey());
    });
  });

  describe('getKeyOrThrow', () => {
    const keyset = new JsonWebKeySet(keys);

    it.each<JsonWebKeyParams>([{ kid: 'unknown' }, { kty: 'oct', kid: 'rsakey' }])(
      'should throw when a key with the provided parameters is not found.',
      (invalidKeyParams) => expect(() => keyset.getKeyOrThrow(invalidKeyParams)).toThrow(JsonWebKeyNotFoundException)
    );

    it('should return a JSON Web Key instance that matches the requested parameters.', () => {
      expect(() => keyset.getKeyOrThrow({ kid: 'octkey' })).not.toThrow();
      expect(keyset.getKeyOrThrow({ kid: 'octkey' })).toMatchObject(loadJwkOctetSequenceKey());
    });
  });
});
