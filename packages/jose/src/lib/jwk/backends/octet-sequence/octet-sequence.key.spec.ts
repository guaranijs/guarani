import { Buffer } from 'buffer';
import { KeyObjectType as CryptoKeyObjectType } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { OctetSequenceKey } from './octet-sequence.key';
import { OctetSequenceKeyParameters } from './octet-sequence.key.parameters';

const invalidSecrets: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  Symbol('foo'),
  Buffer,
  Buffer.alloc(1),
  () => 1,
  {},
  [],
];

const secretParameters: OctetSequenceKeyParameters = { kty: 'oct', k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ' };

describe('Octet Sequence Key', () => {
  describe('constructor', () => {
    it('should throw when providing a "kty" different than "oct".', () => {
      // @ts-expect-error Invalid JSON Web Key Type.
      expect(() => new OctetSequenceKey({ kty: 'unknown' })).toThrow(
        new TypeError('Invalid jwk parameter "kty". Expected "oct", got "unknown".')
      );
    });

    it('should throw when not providing the parameter "k".', () => {
      // @ts-expect-error Missing required parameter "k".
      expect(() => new OctetSequenceKey({ kty: 'oct' })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "k".')
      );
    });

    it.each(invalidSecrets)('should throw when passing an invalid secret.', (k) => {
      expect(() => new OctetSequenceKey({ kty: 'oct', k })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "k".')
      );
    });

    it('should throw when passing an empty secret.', () => {
      expect(() => new OctetSequenceKey({ kty: 'oct', k: '' })).toThrow(
        new InvalidJsonWebKeyException('Invalid jwk parameter "k".')
      );
    });

    it('should create an octet sequence key.', () => {
      let key!: OctetSequenceKey;

      expect(() => (key = new OctetSequenceKey(secretParameters))).not.toThrow();

      expect(key).toMatchObject(secretParameters);

      const { cryptoKey } = key;

      expect(cryptoKey.type).toEqual<CryptoKeyObjectType>('secret');
    });
  });
});
