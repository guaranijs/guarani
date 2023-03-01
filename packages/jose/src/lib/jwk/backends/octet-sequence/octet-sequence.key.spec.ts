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
  Buffer,
  Buffer.alloc(1),
  Symbol('foo'),
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
        new TypeError('Unexpected JSON Web Key Type "unknown" for OctetSequenceKey.')
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

  describe('getThumbprintParameters()', () => {
    it('should return an object with the parameters ["k", "kty"] in this exact order.', () => {
      const key = new OctetSequenceKey(secretParameters);
      const parameters = Object.keys(key['getThumbprintParameters']());

      expect(parameters).toEqual<string[]>(['k', 'kty']);
    });
  });

  describe('getPrivateParameters()', () => {
    it('should return [].', () => {
      const key = new OctetSequenceKey(secretParameters);
      expect(key['getPrivateParameters']()).toEqual<string[]>([]);
    });
  });
});
