import { Buffer } from 'buffer';
import { KeyObjectType as CryptoKeyObjectType, KeyType as CryptoKeyType } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
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

const invalidParameters: any[] = [
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

describe('RSA JSON Web Key', () => {
  describe('constructor', () => {
    it('should throw when providing a "kty" different than "RSA".', () => {
      // @ts-expect-error Invalid JSON Web Key Type.
      expect(() => new RsaKey({ kty: 'unknown' })).toThrow(
        new InvalidJsonWebKeyException('Unexpected JSON Web Key Type "unknown" for RsaKey.')
      );
    });

    it.each(invalidParameters)('should throw when passing an invalid modulus.', (n) => {
      expect(() => new RsaKey({ ...publicParameters, n })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "n".')
      );
    });

    it('should throw when passing a modulus smaller than 2048 bits.', () => {
      expect(() => new RsaKey({ ...publicParameters, n: Buffer.alloc(255, 'a').toString('base64url') })).toThrow(
        new InvalidJsonWebKeyException('The modulus MUST have AT LEAST 2048 bits.')
      );
    });

    it.each(invalidParameters)('should throw when passing an invalid public exponent.', (e) => {
      expect(() => new RsaKey({ ...publicParameters, e })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "e".')
      );
    });

    it.each(invalidParameters)('should throw when passing an invalid private exponent.', (d) => {
      expect(() => new RsaKey({ ...privateParameters, d })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "d".')
      );
    });

    it.each(invalidParameters)('should throw when passing an invalid first prime factor.', (p) => {
      expect(() => new RsaKey({ ...privateParameters, p })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "p".')
      );
    });

    it.each(invalidParameters)('should throw when passing an invalid second prime factor.', (q) => {
      expect(() => new RsaKey({ ...privateParameters, q })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "q".')
      );
    });

    it.each(invalidParameters)('should throw when passing an invalid first factor crt exponent.', (dp) => {
      expect(() => new RsaKey({ ...privateParameters, dp })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "dp".')
      );
    });

    it.each(invalidParameters)('should throw when passing an invalid second factor crt exponent.', (dq) => {
      expect(() => new RsaKey({ ...privateParameters, dq })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "dq".')
      );
    });

    it.each(invalidParameters)('should throw when passing an invalid first factor crt coefficient.', (qi) => {
      expect(() => new RsaKey({ ...privateParameters, qi })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "qi".')
      );
    });

    it('should create an rsa public key.', () => {
      let key!: RsaKey;

      expect(() => (key = new RsaKey(publicParameters))).not.toThrow();

      expect(key).toMatchObject(publicParameters);

      const { cryptoKey } = key;

      expect(cryptoKey.asymmetricKeyType).toEqual<CryptoKeyType>('rsa');
      expect(cryptoKey.type).toEqual<CryptoKeyObjectType>('public');
    });

    it('should create an rsa private key.', () => {
      let key!: RsaKey;

      expect(() => (key = new RsaKey(privateParameters))).not.toThrow();

      expect(key).toMatchObject(privateParameters);

      const { cryptoKey } = key;

      expect(cryptoKey.asymmetricKeyType).toEqual<CryptoKeyType>('rsa');
      expect(cryptoKey.type).toEqual<CryptoKeyObjectType>('private');
    });
  });

  describe('getThumbprintParameters()', () => {
    it('should return an object with the parameters ["e", "kty", "n"] in this exact order.', () => {
      const key = new RsaKey(publicParameters);
      const parameters = Object.keys(key['getThumbprintParameters']());

      expect(parameters).toEqual<string[]>(['e', 'kty', 'n']);
    });
  });

  describe('getPrivateParameters()', () => {
    it('should return ["d", "p", "q", "dp", "dq", "qi"].', () => {
      const key = new RsaKey(publicParameters);
      expect(key['getPrivateParameters']()).toEqual<string[]>(['d', 'p', 'q', 'dp', 'dq', 'qi']);
    });
  });
});
