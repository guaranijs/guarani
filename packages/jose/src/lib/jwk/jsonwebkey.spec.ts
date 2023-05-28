import { Buffer } from 'buffer';
import { KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { EllipticCurveKey } from './backends/elliptic-curve/elliptic-curve.key';
import { EllipticCurveKeyParameters } from './backends/elliptic-curve/elliptic-curve.key.parameters';
import { OctetKeyPairKey } from './backends/octet-key-pair/octet-key-pair.key';
import { OctetSequenceKey } from './backends/octet-sequence/octet-sequence.key';
import { OctetSequenceKeyParameters } from './backends/octet-sequence/octet-sequence.key.parameters';
import { RsaKey } from './backends/rsa/rsa.key';
import { JsonWebKey } from './jsonwebkey';
import { JsonWebKeyOperation } from './jsonwebkey-operation.type';
import { JsonWebKeyUse } from './jsonwebkey-use.type';
import { JsonWebKeyParameters } from './jsonwebkey.parameters';

const secretParameters: OctetSequenceKeyParameters = {
  kty: 'oct',
  k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
};

const publicParameters: EllipticCurveKeyParameters = {
  kty: 'EC',
  crv: 'P-256',
  x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
  y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
};

const privateParameters: EllipticCurveKeyParameters = {
  ...publicParameters,
  d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
};

const invalidUses: any[] = [true, 1, 1.2, 1n, Buffer, Buffer.alloc(1), Symbol('a'), () => 1, {}, []];
const invalidKeyOps: any[] = [true, 1, 1.2, 1n, 'a', Buffer, Buffer.alloc(1), Symbol('a'), () => 1, {}];
const invalidAlgs: any[] = [true, 1, 1.2, 1n, Buffer, Buffer.alloc(1), Symbol('a'), () => 1, {}, []];
const invalidKids: any[] = [true, 1, 1.2, 1n, Buffer, Buffer.alloc(1), Symbol('a'), () => 1, {}, []];
const invalidX5Us: any[] = [true, 1, 1.2, 1n, Buffer, Buffer.alloc(1), 'a', Symbol('a'), () => 1, {}, []];
const invalidX5Cs: any[] = [true, 1, 1.2, 1n, Buffer, Buffer.alloc(1), 'a', Symbol('a'), () => 1, {}, []];
const invalidX5Ts: any[] = [true, 1, 1.2, 1n, Buffer, Buffer.alloc(1), 'a', Symbol('a'), () => 1, {}, []];
const invalidX5T256s: any[] = [true, 1, 1.2, 1n, Buffer, Buffer.alloc(1), 'a', Symbol('a'), () => 1, {}, []];

const invalidLoadParameters: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, () => 1];

const invalidJwkStrings: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  'a',
  Symbol('a'),
  Buffer,
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

JsonWebKey.prototype['getCryptoKey'] = function (): KeyObject {
  return null!;
};

const key: JsonWebKey = Reflect.construct(JsonWebKey, []);

describe('JSON Web Key', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it.each(invalidUses)('should throw when the provided "use" is invalid.', (use) => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...secretParameters, use }])).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "use".')
      );
    });

    it.each(invalidKeyOps)('should throw when the provided "key_ops" is invalid.', (keyOps) => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...secretParameters, key_ops: keyOps }])).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "key_ops".')
      );
    });

    it('should throw when the provided "key_ops" is an empty array.', () => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...secretParameters, key_ops: [] }])).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "key_ops".')
      );
    });

    it('should throw when the provided "key_ops" is not an array of strings.', () => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...secretParameters, key_ops: ['sign', 123] }])).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "key_ops".')
      );
    });

    it('should throw when the provided "key_ops" array contains repeated values.', () => {
      expect(() => {
        return Reflect.construct(JsonWebKey, [{ ...secretParameters, key_ops: ['sign', 'sign'] }]);
      }).toThrow(new InvalidJsonWebKeyException('JWK parameter "key_ops" cannot have repeated operations.'));
    });

    it.each(invalidUseKeyOps)(
      'should throw when there\'s an invalid combination of "use" and "key_ops".',
      (use, keyOps) => {
        expect(() => Reflect.construct(JsonWebKey, [{ ...privateParameters, use, key_ops: keyOps }])).toThrow(
          new InvalidJsonWebKeyException('Invalid combination of "use" and "key_ops".')
        );
      }
    );

    it.each(invalidAlgs)('should throw when the provided "alg" is invalid.', (alg) => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...secretParameters, alg }])).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "alg".')
      );
    });

    it.each(invalidKids)('should throw when the provided "kid" is invalid.', (kid) => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...secretParameters, kid }])).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "kid".')
      );
    });

    it.each(invalidX5Us)('should throw when providing the unsupported parameter "x5u".', (x5u) => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...publicParameters, x5u }])).toThrow(
        new InvalidJsonWebKeyException('Unsupported jwk parameter "x5u".')
      );
    });

    it.each(invalidX5Cs)('should throw when providing the unsupported parameter "x5c".', (x5c) => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...publicParameters, x5c }])).toThrow(
        new InvalidJsonWebKeyException('Unsupported jwk parameter "x5c".')
      );
    });

    it.each(invalidX5Ts)('should throw when providing the unsupported parameter "x5t".', (x5t) => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...publicParameters, x5t }])).toThrow(
        new InvalidJsonWebKeyException('Unsupported jwk parameter "x5t".')
      );
    });

    it.each(invalidX5T256s)('should throw when providing the unsupported parameter "x5t#S256".', (x5tS256) => {
      expect(() => Reflect.construct(JsonWebKey, [{ ...publicParameters, 'x5t#S256': x5tS256 }])).toThrow(
        new InvalidJsonWebKeyException('Unsupported jwk parameter "x5t#S256".')
      );
    });
  });

  describe('thumbprint', () => {
    it('should return the sha-256 thumbprint of a json web key.', () => {
      key['getThumbprintParameters'] = function (): JsonWebKeyParameters {
        return {
          e: 'AQAB',
          kty: 'RSA',
          n:
            '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86z' +
            'wu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5Js' +
            'GY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMic' +
            'AtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-' +
            'bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csF' +
            'Cur-kEgU8awapJzKnqDKgw',
        };
      };

      expect(key.thumbprint.toString('base64url')).toEqual('NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs');

      Reflect.deleteProperty(key, 'getThumbprintParameters');
    });
  });

  describe('load()', () => {
    it.each(invalidLoadParameters)('should throw when providing an invalid data.', async (data) => {
      await expect(JsonWebKey.load(data)).rejects.toThrow(
        new InvalidJsonWebKeyException('The provided data is not a valid JSON Web Key object.')
      );
    });

    it('should throw when the provided data does not have a "kty" attribute.', async () => {
      await expect(JsonWebKey.load({})).rejects.toThrow(
        new InvalidJsonWebKeyException('The provided data does not have a "kty" parameter.')
      );
    });

    it('should throw when the provided "kty" is not supported.', async () => {
      await expect(JsonWebKey.load({ kty: 'unknown' })).rejects.toThrow(
        new UnsupportedAlgorithmException('Unsupported JSON Web Key Type "unknown".')
      );
    });

    it('should return an instance of a json web key.', async () => {
      await expect(JsonWebKey.load(privateParameters)).resolves.toBeInstanceOf(JsonWebKey);
    });
  });

  describe('parse()', () => {
    it.each(invalidJwkStrings)('should throw when providing an invalid data.', async (data) => {
      await expect(JsonWebKey.parse(data)).rejects.toThrow(InvalidJsonWebKeyException);
    });

    it('should throw when the provided data does not have a "kty" attribute.', async () => {
      await expect(JsonWebKey.parse('{}')).rejects.toThrow(
        new InvalidJsonWebKeyException('The provided data does not have a "kty" parameter.')
      );
    });

    it('should throw when the provided "kty" is not supported.', async () => {
      await expect(JsonWebKey.parse('{"kty":"unknown"}')).rejects.toThrow(
        new UnsupportedAlgorithmException('Unsupported JSON Web Key Type "unknown".')
      );
    });

    it('should return an instance of a json web key.', async () => {
      await expect(JsonWebKey.parse(JSON.stringify(privateParameters))).resolves.toBeInstanceOf(JsonWebKey);
    });
  });

  describe('generate()', () => {
    it('should throw when the provided "kty" is not supported.', async () => {
      // @ts-expect-error Unsupported JSON Web Key Type.
      await expect(JsonWebKey.generate('unknown', { kty: 'unknown' })).rejects.toThrow(
        new TypeError('Unsupported JSON Web Key Type "unknown".')
      );
    });

    it('should return an instance of an elliptic curve json web key.', async () => {
      await expect(JsonWebKey.generate('EC', { curve: 'P-256' })).resolves.toBeInstanceOf(EllipticCurveKey);
    });

    it('should return an instance of an octet key pair json web key.', async () => {
      await expect(JsonWebKey.generate('OKP', { curve: 'Ed25519' })).resolves.toBeInstanceOf(OctetKeyPairKey);
    });

    it('should return an instance of an rsa json web key.', async () => {
      await expect(JsonWebKey.generate('RSA', { modulus: 2048 })).resolves.toBeInstanceOf(RsaKey);
    });

    it('should return an instance of an octet sequence json web key.', async () => {
      await expect(JsonWebKey.generate('oct', { length: 32 })).resolves.toBeInstanceOf(OctetSequenceKey);
    });
  });

  describe('toJSON()', () => {
    it('should return the parameters of a symmetric key.', () => {
      const key: JsonWebKey<OctetSequenceKeyParameters> = Reflect.construct(JsonWebKey, [secretParameters]);

      key['getPrivateParameters'] = function () {
        return [];
      };

      expect(key.toJSON()).toMatchObject(secretParameters);
      expect(key.toJSON(true)).toMatchObject(secretParameters);
      expect(key.toJSON(false)).toMatchObject(secretParameters);
    });

    it('should return the parameters of an asymmetric key.', () => {
      const publicKey: JsonWebKey<EllipticCurveKeyParameters> = Reflect.construct(JsonWebKey, [publicParameters]);
      const privateKey: JsonWebKey<EllipticCurveKeyParameters> = Reflect.construct(JsonWebKey, [privateParameters]);

      publicKey['getPrivateParameters'] = function () {
        return ['d'];
      };

      privateKey['getPrivateParameters'] = function () {
        return ['d'];
      };

      expect(publicKey.toJSON()).toMatchObject(publicParameters);
      expect(publicKey.toJSON(true)).toMatchObject(publicParameters);
      expect(publicKey.toJSON(false)).toMatchObject(publicParameters);

      expect(privateKey.toJSON()).toMatchObject(publicParameters);
      expect(privateKey.toJSON(true)).toMatchObject(publicParameters);
      expect(privateKey.toJSON(false)).toMatchObject(privateParameters);
    });
  });
});
