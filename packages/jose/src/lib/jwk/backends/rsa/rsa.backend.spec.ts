import { Buffer } from 'buffer';
import { KeyObjectType, KeyType } from 'crypto';

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

const privateParameters: RsaKeyParameters = {
  ...publicParameters,
  d:
    'cc2YrWia9LGRad0SMe0PrlmeeHSyRe5-u--QJcP4uF_5LYYzXIsjDJ9_iYh0S_YY' +
    'e6bLjqHOSp44OHvJqoXMX5j3-ECKnNjnUHMtRB2awXGBqBOhB8TqoQXgmXDi1jx_' +
    '6Fu8xH-vaSfpwrsN-0QzIcYHil6b8hwE0f0r6istBmL7iayJbnONp7na9ow2fUQl' +
    'nr41vsHZa4knTZ2E2kq5ntgaXlF6AIdc4DD_BZpf2alEbhQMX9T168ZsSyAs7wKS' +
    'd3ivhHRQayXEapUfZ_ykvnF4-DoVI1iRoowgZ-dlnv4Ff3YrKQ3Zv3uHJcF1BtWQ' +
    'VipOIHx4GyIc4bmTSA5PEQ',
  p:
    '-ZFuDg38cG-e5L6h1Jbn8ngifWgHx8m1gybkY7yEpU1V02fvQAMI1XG-1WpZm2xj' +
    'j218wNCj0BCEdmdBqZMk5RlzLagtfzQ3rPO-ucYPZ_SDmy8Udzr-sZLCqMFyLtxk' +
    'gMfGo4QZ6UJWYpTCCmZ92nS_pa4ePrQdlpnS4DLv_SM',
  q:
    'y1YdZtsbYfCOdsYBZrDpcvubwMN2fKRAzETYW5sqYv8XkxHG1J1zHH-zWJBQfZhT' +
    'biHPgHvoaFykEm9xhuA77RFGRXxFUrGBtfqIx_OG-kRWudmH83EyMzMoKQaW98RX' +
    'WqRO1JDlcs4_vzf_KN63zQKv5i4UdiiObQkZCYIOVUk',
  dp:
    'vqtDX-2DjgtZY_3Y-eiJMRBjmVgfiZ4r1RWjrCddWEVrauafPVKULy6F09s6tqnq' +
    'rqvBgjZk0ROtgCCHZB0NNRNqkdlJWUP1vWdDsf8FyjBfU_J2OlmSOOydV_zjVbX_' +
    '-vumYUsN2M5b3Vk1nmiLgplryhLq_JDzghnnqG6CN-0',
  dq:
    'tKczxBhSwbcpu5i70fLH1iJ5BNAkSyTbdSCNYQYAqKee2Elo76lbhixmuP6upIdb' +
    'SHO9mZd8qov0MXTV1lEOrNc2KbH5HTkb1wRZ1dwlReDFdKUxxjYBtb9zpM93_XVx' +
    'btSgPPbnBBL-S_OCPVtyzS_f-49hGoF52KHGns3v0hE',
  qi:
    'C4q9uIi-1fYhE0NTWVNzdhSi7fA3uznTWaW1X5LWBF4gBOcWvMMTfOZEaPjtY2WP' +
    'XaTWU4bdVN0GgktVLUDPLrSj533W1cOQZb_mm_7BFNrleelruT87bZhWPYQ979kl' +
    '6590ySgbH81pEM8FQW1JBATz0MYtUNZAt8N360vayE4',
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
        new TypeError('The value of the RSA Modulus must be an integer.'),
      );
    });

    it('should throw when providing a modulus less than 2048.', async () => {
      await expect(backend.generate({ modulus: 2047 })).rejects.toThrow(
        new TypeError('The value of the RSA Modulus must be at least 2048.'),
      );
    });

    it.each(invalidPublicExponents)('should throw when passing an invalid public exponent.', async (publicExponent) => {
      await expect(backend.generate({ modulus: 2048, publicExponent })).rejects.toThrow(
        new TypeError('The value of the RSA Public Exponent must be an integer.'),
      );
    });

    it('should generate an rsa json web key.', async () => {
      await expect(backend.generate({ modulus: 2048 })).resolves.toBeInstanceOf(RsaKey);
    });
  });

  describe('getCryptoKey()', () => {
    it('should generate a public rsa key.', () => {
      const key = backend.getCryptoKey(publicParameters);

      expect(key.type).toEqual<KeyObjectType>('public');
      expect(key.asymmetricKeyType).toEqual<KeyType>('rsa');
    });

    it('should generate a private rsa key.', () => {
      const key = backend.getCryptoKey(privateParameters);

      expect(key.type).toEqual<KeyObjectType>('private');
      expect(key.asymmetricKeyType).toEqual<KeyType>('rsa');
    });
  });

  describe('getPrivateParameters()', () => {
    it('should return ["d", "p", "q", "dp", "dq", "qi"].', () => {
      expect(backend.getPrivateParameters()).toEqual<string[]>(['d', 'p', 'q', 'dp', 'dq', 'qi']);
    });
  });

  describe('getThumbprintParameters()', () => {
    it('should return an object with the parameters ["e", "kty", "n"] in this exact order.', () => {
      const parameters = Object.keys(backend['getThumbprintParameters'](publicParameters));
      expect(parameters).toEqual<string[]>(['e', 'kty', 'n']);
    });
  });
});
