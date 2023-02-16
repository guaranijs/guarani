import { Buffer } from 'buffer';
import { KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { EcKeyParameters } from './backends/ec/eckey.parameters';
import { OctKeyParameters } from './backends/oct/octkey.parameters';
import { JsonWebKey } from './jsonwebkey';
import { JsonWebKeyOperation } from './jsonwebkey-operation.type';
import { JsonWebKeyUse } from './jsonwebkey-use.type';
import { JsonWebKeyParameters } from './jsonwebkey.parameters';

const secretParameters: OctKeyParameters = {
  kty: 'oct',
  k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
};

const publicParameters: EcKeyParameters = {
  kty: 'EC',
  crv: 'P-256',
  x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
  y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
};

const privateParameters: EcKeyParameters = {
  ...publicParameters,
  d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
};

const invalidUses: unknown[] = [null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol('a'), () => 1, {}, []];
const invalidKeyOps: unknown[] = [null, true, 1, 1.2, 1n, 'a', Buffer.alloc(1), Symbol('a'), () => 1, {}];

const invalidAlgs: unknown[] = [...invalidUses];
const invalidKids: unknown[] = [...invalidUses];

const invalidX5Us: unknown[] = [null, true, 1, 1.2, 1n, Buffer.alloc(1), 'a', Symbol('a'), () => 1, {}, []];
const invalidX5Cs: unknown[] = [...invalidX5Us];
const invalidX5Ts: unknown[] = [...invalidX5Us];
const invalidX5T256s: unknown[] = [...invalidX5Us];

const invalidJwkStrings: unknown[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  'a',
  Symbol('a'),
  Buffer.alloc(1),
  () => 1,
  {},
  [],
];

const invalidUseKeyOps: [JsonWebKeyUse, JsonWebKeyOperation[]][] = [
  ['enc', ['sign']],
  ['enc', ['verify']],
  ['enc', ['decrypt', 'sign']],
  ['sig', ['decrypt']],
  ['sig', ['deriveBits']],
  ['sig', ['deriveKey']],
  ['sig', ['encrypt']],
  ['sig', ['unwrapKey']],
  ['sig', ['wrapKey']],
  ['sig', ['sign', 'decrypt']],
];

describe('JSON Web Key', () => {
  describe('constructor', () => {
    it('should throw when no "kty" is provided.', () => {
      // @ts-expect-error Invalid parameter "kty".
      expect(() => new JsonWebKey({})).toThrow(
        new InvalidJsonWebKeyException('The provided parameters do not represent a valid JSON Web Key.')
      );
    });

    it('should throw when the provided "kty" is unsupported.', () => {
      // @ts-expect-error Unsupported "kty".
      expect(() => new JsonWebKey({ kty: 'unknown' })).toThrow(
        new UnsupportedAlgorithmException('Unsupported JSON Web Key Algorithm "unknown".')
      );
    });

    it.each(invalidUses)('should throw when the provided "use" is invalid.', (use) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebKey(secretParameters, { use })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "use".')
      );
    });

    it.each(invalidKeyOps)('should throw when the provided "key_ops" is invalid.', (keyOps) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebKey(secretParameters, { key_ops: keyOps })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "key_ops".')
      );
    });

    it('should throw when the provided "key_ops" is an empty array.', () => {
      expect(() => new JsonWebKey(secretParameters, { key_ops: [] })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "key_ops".')
      );
    });

    it('should throw when the provided "key_ops" is not an array of strings.', () => {
      // @ts-expect-error Invalid "key_ops".
      expect(() => new JsonWebKey(secretParameters, { key_ops: ['sign', 123] })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "key_ops".')
      );
    });

    it('should throw when the provided "key_ops" array contains repeated values.', () => {
      expect(() => {
        return new JsonWebKey(secretParameters, { key_ops: ['sign', 'sign'] });
      }).toThrow(new InvalidJsonWebKeyException('Key parameter "key_ops" cannot have repeated operations.'));
    });

    it.each(invalidUseKeyOps)(
      'should throw when there\'s an invalid combination of "use" and "key_ops".',
      (use, keyOps) => {
        expect(() => new JsonWebKey(privateParameters, { use, key_ops: keyOps })).toThrow(
          new InvalidJsonWebKeyException('Invalid combination of "use" and "key_ops".')
        );
      }
    );

    it.each(invalidAlgs)('should throw when the provided "alg" is invalid.', (alg) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebKey(secretParameters, { alg })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "alg".')
      );
    });

    it.each(invalidKids)('should throw when the provided "kid" is invalid.', (kid) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebKey(secretParameters, { kid })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "kid".')
      );
    });

    it.each(invalidX5Us)('should throw when providing the unsupported parameter "x5u".', (x5u) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebKey(publicParameters, { x5u })).toThrow(
        new InvalidJsonWebKeyException('Unsupported key parameter "x5u".')
      );
    });

    it.each(invalidX5Cs)('should throw when providing the unsupported parameter "x5c".', (x5c) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebKey(publicParameters, { x5c })).toThrow(
        new InvalidJsonWebKeyException('Unsupported key parameter "x5c".')
      );
    });

    it.each(invalidX5Ts)('should throw when providing the unsupported parameter "x5t".', (x5t) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebKey(publicParameters, { x5t })).toThrow(
        new InvalidJsonWebKeyException('Unsupported key parameter "x5t".')
      );
    });

    it.each(invalidX5T256s)('should throw when providing the unsupported parameter "x5t#S256".', (x5tS256) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebKey(publicParameters, { 'x5t#S256': x5tS256 })).toThrow(
        new InvalidJsonWebKeyException('Unsupported key parameter "x5t#S256".')
      );
    });

    it('should create an instance of a json web key.', () => {
      let key!: JsonWebKey;

      expect(() => (key = new JsonWebKey(publicParameters))).not.toThrow();

      expect(key).toBeInstanceOf(JsonWebKey);
      expect(key).toMatchObject<JsonWebKeyParameters>(publicParameters);

      expect(key.cryptoKey).toBeInstanceOf(KeyObject);
    });
  });

  describe('thumbprint', () => {
    it('should return the sha-256 thumbprint of a json web key.', () => {
      const key = new JsonWebKey({
        kty: 'RSA',
        n:
          '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86z' +
          'wu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5Js' +
          'GY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMic' +
          'AtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-' +
          'bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csF' +
          'Cur-kEgU8awapJzKnqDKgw',
        e: 'AQAB',
        alg: 'RS256',
        kid: '2011-04-29',
      });

      expect(key.thumbprint.toString('base64url')).toEqual('NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');
    });
  });

  describe('parse()', () => {
    it.each(invalidJwkStrings)('should throw when the provided data is invalid.', (invalidJwkString) => {
      // @ts-expect-error Invalid Type
      expect(() => JsonWebKey.parse(invalidJwkString)).toThrow(InvalidJsonWebKeyException);
    });

    it('should parse a valid jwk string into a json web key object.', () => {
      const jwk = '{"kty":"oct","k":"qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ"}';
      expect(JsonWebKey.parse(jwk)).toMatchObject<JsonWebKeyParameters>(secretParameters);
    });
  });

  describe('toJSON()', () => {
    const secretKey = new JsonWebKey(secretParameters, { kid: 'secret-key' });
    const privateKey = new JsonWebKey(privateParameters, { kid: 'private-key' });

    it('should only return the jwk parameters of the secret key.', () => {
      expect(secretKey.toJSON()).toMatchObject({ kid: 'secret-key' });
    });

    it('should return the parameters of the secret key.', () => {
      expect(secretKey.toJSON(false)).toMatchObject<JsonWebKeyParameters>({ ...secretParameters, kid: 'secret-key' });
    });

    it('should return the public parameters of the private key.', () => {
      expect(privateKey.toJSON()).toMatchObject<JsonWebKeyParameters>({ ...publicParameters, kid: 'private-key' });
    });

    it('should return the private parameters of the private key.', () => {
      expect(privateKey.toJSON(false)).toMatchObject<JsonWebKeyParameters>({
        ...privateParameters,
        kid: 'private-key',
      });
    });
  });
});
