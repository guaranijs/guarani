import { Buffer } from 'buffer';

import { RsaBackend } from './rsa.backend';
import { RsaKey } from './rsa.key';
import { RsaKeyParameters } from './rsa.key.parameters';

const publicParameters: RsaKeyParameters = {
  kty: 'RSA',
  n:
    'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
    'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
    'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
    'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
    'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
    '5JG5iK0nsm1uZYu-02XN-w',
  e: 'AQAB',
};

const invalidModuli: any[] = [undefined, null, true, 1.2, 1n, Symbol('foo'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidPublicExponents: any[] = [null, true, 1.2, 1n, Symbol('foo'), Buffer, Buffer.alloc(1), () => 1, {}, []];

describe('RSA JSON Web Key Backend', () => {
  const backend = new RsaBackend();

  describe('load()', () => {
    it('should load the provided parameters into an rsa json web key.', async () => {
      await expect(backend.load(publicParameters)).resolves.toBeInstanceOf(RsaKey);
    });
  });

  describe('generate()', () => {
    it.each(invalidModuli)('should throw when passing an invalid modulus.', async (modulus) => {
      await expect(backend.generate({ modulus })).rejects.toThrow(
        new TypeError('The value of the RSA Modulus must be an integer.')
      );
    });

    it('should throw when providing a modulus less than 2048.', async () => {
      await expect(backend.generate({ modulus: 2047 })).rejects.toThrow(
        new TypeError('The value of the RSA Modulus must be at least 2048.')
      );
    });

    it.each(invalidPublicExponents)('should throw when passing an invalid public exponent.', async (publicExponent) => {
      await expect(backend.generate({ modulus: 2048, publicExponent })).rejects.toThrow(
        new TypeError('The value of the RSA Public Exponent must be an integer.')
      );
    });

    it('should generate an rsa json web key.', async () => {
      await expect(backend.generate({ modulus: 2048 })).resolves.toBeInstanceOf(RsaKey);
    });
  });
});
