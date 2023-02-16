import { Buffer } from 'buffer';
import { KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { OctKeyBackend } from './octkey.backend';
import { OctKeyParameters } from './octkey.parameters';

const secretParameters: OctKeyParameters = {
  kty: 'oct',
  k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
};

const invalidSecrets: unknown[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol('foo'), () => 1, {}, []];

const backend = new OctKeyBackend();

describe('JSON Web Key Octet Sequence Backend', () => {
  describe('requiredParameters', () => {
    it('should have ["kty", "k"] as its value.', () => {
      expect(backend.requiredParameters).toEqual(['kty', 'k']);
    });
  });

  describe('privateParameters', () => {
    it('should have ["k"] as its value.', () => {
      expect(backend.privateParameters).toEqual(['k']);
    });
  });

  describe('load()', () => {
    it('should throw when not providing the parameter "k".', () => {
      expect(() => backend.load({ kty: 'oct' })).toThrow(
        new InvalidJsonWebKeyException('The provided parameters do not represent a valid "oct" key.')
      );
    });

    it.each(invalidSecrets)('should throw when passing an invalid secret.', (k) => {
      expect(() => backend.load({ kty: 'oct', k })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "k".')
      );
    });

    it('should throw when passing an empty secret.', () => {
      expect(() => backend.load({ kty: 'oct', k: '' })).toThrow(
        new InvalidJsonWebKeyException('The Secret cannot be empty.')
      );
    });

    it('should load a secret octet sequence key.', () => {
      let secretKey!: KeyObject;

      expect(() => (secretKey = backend.load(secretParameters))).not.toThrow();
      expect(secretKey.type).toBe('secret');
    });
  });
});
