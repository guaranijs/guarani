import { Buffer } from 'buffer';
import { KeyObjectType } from 'crypto';

import { OctetSequenceBackend } from './octet-sequence.backend';
import { OctetSequenceKey } from './octet-sequence.key';
import { OctetSequenceKeyParameters } from './octet-sequence.key.parameters';

const secretParameters: OctetSequenceKeyParameters = {
  kty: 'oct',
  k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
};

const invalidLength: any[] = [undefined, null, true, 1.2, 1n, Symbol('foo'), Buffer, Buffer.alloc(1), () => 1, {}, []];

describe('Octet Sequence JSON Web Key Backend', () => {
  const backend = new OctetSequenceBackend();

  describe('load()', () => {
    it('should load the provided parameters into an octet sequence json web key.', async () => {
      await expect(backend.load(secretParameters)).resolves.toBeInstanceOf(OctetSequenceKey);
    });
  });

  describe('generate()', () => {
    it.each(invalidLength)('should throw when passing an invalid length.', async (length) => {
      await expect(backend.generate({ length })).rejects.toThrow(
        new TypeError('The length of the Octet Sequence Secret must be an integer.'),
      );
    });

    it('should throw when providing a length zero.', async () => {
      await expect(backend.generate({ length: 0 })).rejects.toThrow(
        new TypeError('The length of the Octet Sequence Secret must be greater than zero.'),
      );
    });

    it('should throw when providing a negative length.', async () => {
      await expect(backend.generate({ length: -1 })).rejects.toThrow(
        new TypeError('The length of the Octet Sequence Secret must be greater than zero.'),
      );
    });

    it('should generate an octet sequence json web key.', async () => {
      let key!: OctetSequenceKey;

      expect((key = await backend.generate({ length: 32 }))).toBeInstanceOf(OctetSequenceKey);
      expect(Buffer.byteLength(key.k, 'base64url')).toEqual(32);
    });
  });

  describe('getCryptoKey()', () => {
    it('should generate a secret octet sequence key.', () => {
      const key = backend.getCryptoKey(secretParameters);

      expect(key.type).toEqual<KeyObjectType>('secret');
    });
  });

  describe('getPrivateParameters()', () => {
    it('should return [].', () => {
      expect(backend.getPrivateParameters()).toEqual<string[]>([]);
    });
  });

  describe('getThumbprintParameters()', () => {
    it('should return an object with the parameters ["k", "kty"] in this exact order.', () => {
      const parameters = Object.keys(backend['getThumbprintParameters'](secretParameters));
      expect(parameters).toEqual<string[]>(['k', 'kty']);
    });
  });
});
