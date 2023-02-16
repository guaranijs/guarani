import { Buffer } from 'buffer';
import { KeyObject } from 'crypto';

import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { RsaKeyBackend } from './rsakey.backend';
import { RsaKeyParameters } from './rsakey.parameters';

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

const invalidPublic: unknown[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol('foo'), () => 1, {}, []];
const invalidPrivate: unknown[] = [null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol('foo'), () => 1, {}, []];

const backend = new RsaKeyBackend();

describe('JSON Web Key RSA Backend', () => {
  describe('requiredParameters', () => {
    it('should have ["kty", "n", "e"] as its value.', () => {
      expect(backend.requiredParameters).toEqual(['kty', 'n', 'e']);
    });
  });

  describe('privateParameters', () => {
    it('should have ["d", "p", "q", "dp", "dq", "qi"] as its value.', () => {
      expect(backend.privateParameters).toEqual(['d', 'p', 'q', 'dp', 'dq', 'qi']);
    });
  });

  describe('load()', () => {
    it('should throw when not providing the parameter "n".', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { n, ...missingParameters } = publicParameters;

      expect(() => backend.load({ ...missingParameters })).toThrow(
        new InvalidJsonWebKeyException('The provided parameters do not represent a valid "RSA" key.')
      );
    });

    it('should throw when not providing the parameter "e".', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { e, ...missingParameters } = publicParameters;

      expect(() => backend.load({ ...missingParameters })).toThrow(
        new InvalidJsonWebKeyException('The provided parameters do not represent a valid "RSA" key.')
      );
    });

    it.each(backend.privateParameters)('should throw when not providing a required private parameter.', (parameter) => {
      const parameters: RsaKeyParameters = JSON.parse(JSON.stringify(privateParameters));
      delete parameters[parameter];

      expect(() => backend.load(parameters)).toThrow(
        new InvalidJsonWebKeyException('The provided parameters do not represent a valid "RSA" key.')
      );
    });

    it.each(invalidPublic)('should throw when passing an invalid modulus.', (n) => {
      expect(() => backend.load({ ...publicParameters, n })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "n".')
      );
    });

    it('should throw when passing a modulus smaller than 2048 bits.', () => {
      expect(() => backend.load({ ...publicParameters, n: Buffer.alloc(255, 'a').toString('base64url') })).toThrow(
        new InvalidJsonWebKeyException('The modulus MUST have AT LEAST 2048 bits.')
      );
    });

    it.each(invalidPublic)('should throw when passing an invalid public exponent.', (e) => {
      expect(() => backend.load({ ...publicParameters, e })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "e".')
      );
    });

    it.each(invalidPrivate)('should throw when passing an invalid private exponent.', (d) => {
      expect(() => backend.load({ ...privateParameters, d })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "d".')
      );
    });

    it.each(invalidPrivate)('should throw when passing an invalid first prime factor.', (p) => {
      expect(() => backend.load({ ...privateParameters, p })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "p".')
      );
    });

    it.each(invalidPrivate)('should throw when passing an invalid second prime factor.', (q) => {
      expect(() => backend.load({ ...privateParameters, q })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "q".')
      );
    });

    it.each(invalidPrivate)('should throw when passing an invalid first factor crt exponent.', (dp) => {
      expect(() => backend.load({ ...privateParameters, dp })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "dp".')
      );
    });

    it.each(invalidPrivate)('should throw when passing an invalid second factor crt exponent.', (dq) => {
      expect(() => backend.load({ ...privateParameters, dq })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "dq".')
      );
    });

    it.each(invalidPrivate)('should throw when passing an invalid first factor crt coefficient.', (qi) => {
      expect(() => backend.load({ ...privateParameters, qi })).toThrow(
        new InvalidJsonWebKeyException('Invalid key parameter "qi".')
      );
    });

    it('should load a public rsa crypto key.', () => {
      let publicKey!: KeyObject;

      expect(() => (publicKey = backend.load(publicParameters))).not.toThrow();
      expect(publicKey.asymmetricKeyType).toBe('rsa');
      expect(publicKey.type).toBe('public');
    });

    it('should load a private rsa crypto key.', () => {
      let privateKey!: KeyObject;

      expect(() => (privateKey = backend.load(privateParameters))).not.toThrow();
      expect(privateKey.asymmetricKeyType).toBe('rsa');
      expect(privateKey.type).toBe('private');
    });
  });
});
