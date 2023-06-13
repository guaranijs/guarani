import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebKeySetException } from '../exceptions/invalid-jsonwebkeyset.exception';
import { EllipticCurveKey } from '../jwk/backends/elliptic-curve/elliptic-curve.key';
import { EllipticCurveKeyParameters } from '../jwk/backends/elliptic-curve/elliptic-curve.key.parameters';
import { RsaKey } from '../jwk/backends/rsa/rsa.key';
import { RsaKeyParameters } from '../jwk/backends/rsa/rsa.key.parameters';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebKeySet } from './jsonwebkeyset';
import { JsonWebKeySetParameters } from './jsonwebkeyset.parameters';

const publicEllipticCurveParameters: EllipticCurveKeyParameters = {
  kty: 'EC',
  crv: 'P-256',
  x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
  y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
};

const privateEllipticCurveParameters: EllipticCurveKeyParameters = {
  ...publicEllipticCurveParameters,
  d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
};

const publicRsaParameters: RsaKeyParameters = {
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

const privateRsaParameters: RsaKeyParameters = {
  ...publicRsaParameters,
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

const invalidJwkSets: any[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  'a',
  Symbol('a'),
  Buffer,
  Buffer.alloc(0),
  () => 1,
  {},
  [],
  ['a'],
];

const invalidParameters: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Buffer, Symbol('a'), () => 1];
const invalidKeysParameters: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, () => 1, []];

describe('JSON Web Key Set', () => {
  describe('constructor', () => {
    it.each(invalidJwkSets)('should reject an invalid set of json web keys.', (keySet) => {
      expect(() => new JsonWebKeySet(keySet)).toThrow(new TypeError('Invalid parameter "keys".'));
    });

    it('should reject a set containing json web keys with duplicate key identifiers.', () => {
      const jwkSetWithRepeatedKeyIdentifiers: JsonWebKey[] = [
        new EllipticCurveKey(publicEllipticCurveParameters, { kid: 'static-id' }),
        new RsaKey(publicRsaParameters, { kid: 'static-id' }),
      ];

      expect(() => new JsonWebKeySet(jwkSetWithRepeatedKeyIdentifiers)).toThrow(
        new InvalidJsonWebKeySetException('The use of duplicate Key Identifiers is forbidden.')
      );
    });

    it('should ensure all json web keys have identifiers.', () => {
      let jwks!: JsonWebKeySet;

      expect(() => {
        return (jwks = new JsonWebKeySet([
          new EllipticCurveKey(publicEllipticCurveParameters),
          new RsaKey(publicRsaParameters),
        ]));
      }).not.toThrow();

      jwks.keys.forEach((jwk) => expect(typeof jwk.kid).toEqual('string'));
    });
  });

  describe('load()', () => {
    it.each(invalidParameters)('should reject an invalid "parameters".', async (invalidParameters) => {
      await expect(JsonWebKeySet.load(invalidParameters)).rejects.toThrow(new InvalidJsonWebKeySetException());
    });

    it.each(invalidKeysParameters)('should reject an invalid "keys" json web key set parameter.', async (keys) => {
      await expect(JsonWebKeySet.load({ keys })).rejects.toThrow(
        new InvalidJsonWebKeySetException('Invalid jwks parameter "keys".')
      );
    });

    it.each(invalidKeysParameters)(
      'should throw when the "keys" json web key set parameter is an array of invalid values.',
      async (keyParameter) => {
        await expect(JsonWebKeySet.load({ keys: [keyParameter] })).rejects.toThrow(
          new InvalidJsonWebKeySetException('The provided data is not a valid JSON Web Key Set object.', {
            cause: new InvalidJsonWebKeyException('The provided data is not a valid JSON Web Key object.'),
          })
        );
      }
    );

    it('should throw when the "keys" json web key set parameter has an object missing the parameter "kty".', async () => {
      await expect(JsonWebKeySet.load({ keys: [{}] })).rejects.toThrow(
        new InvalidJsonWebKeySetException('The provided data is not a valid JSON Web Key Set object.', {
          cause: new InvalidJsonWebKeyException('The provided data does not have a "kty" parameter.'),
        })
      );
    });

    it('should create a json web key set based on valid parameters.', async () => {
      const parameters: JsonWebKeySetParameters = { keys: [{ ...publicEllipticCurveParameters, kid: 'foo' }] };
      const jwks = await JsonWebKeySet.load(parameters);

      expect(jwks.toJSON()).toStrictEqual(parameters);
    });
  });

  describe('parse()', () => {
    it('should parse a json encoded json web key set.', async () => {
      const parameters: JsonWebKeySetParameters = { keys: [{ ...publicEllipticCurveParameters, kid: 'foo' }] };
      const jsonEncoded =
        '{"keys":[{"kty":"EC","crv":"P-256","x":"4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og","y":"mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8","kid":"foo"}]}';

      const jwks = await JsonWebKeySet.parse(jsonEncoded);

      expect(jwks.toJSON()).toStrictEqual(parameters);
    });
  });

  describe('find()', () => {
    const jwks = new JsonWebKeySet([
      new EllipticCurveKey(publicEllipticCurveParameters, { kid: 'ec-key', use: 'sig' }),
      new RsaKey(publicRsaParameters, { kid: 'rsa-key', key_ops: ['encrypt'] }),
    ]);

    it('should return null when no key matches the provided predicate.', () => {
      expect(jwks.find((key) => key.kid === 'unknown')).toBeNull();
    });

    it('should return the key that matches the provided predicate.', () => {
      expect(jwks.find((key) => key.kid === 'ec-key')).toStrictEqual(jwks.keys[0]!);
      expect(jwks.find((key) => key.key_ops?.includes('encrypt') ?? false)).toStrictEqual(jwks.keys[1]!);
    });
  });

  describe('toJSON()', () => {
    it('should return the public keys\' parameters when not providing "exportPublic".', () => {
      const jwks = new JsonWebKeySet([
        new EllipticCurveKey(publicEllipticCurveParameters, { kid: 'ec-key', use: 'sig' }),
        new RsaKey(privateRsaParameters, { kid: 'rsa-key', use: 'sig' }),
      ]);

      expect(jwks.toJSON()).toStrictEqual<JsonWebKeySetParameters>({
        keys: [
          { ...publicEllipticCurveParameters, kid: 'ec-key', use: 'sig' },
          { ...publicRsaParameters, kid: 'rsa-key', use: 'sig' },
        ],
      });
    });

    it('should return the public keys\' parameters when "exportPublic" is "true".', () => {
      const jwks = new JsonWebKeySet([
        new EllipticCurveKey(publicEllipticCurveParameters, { kid: 'ec-key', use: 'sig' }),
        new RsaKey(privateRsaParameters, { kid: 'rsa-key', use: 'sig' }),
      ]);

      expect(jwks.toJSON(true)).toStrictEqual<JsonWebKeySetParameters>({
        keys: [
          { ...publicEllipticCurveParameters, kid: 'ec-key', use: 'sig' },
          { ...publicRsaParameters, kid: 'rsa-key', use: 'sig' },
        ],
      });
    });

    it('should return the keys\' parameters when "exportPublic" is "false".', () => {
      const jwks = new JsonWebKeySet([
        new EllipticCurveKey(privateEllipticCurveParameters, { kid: 'ec-key', use: 'sig' }),
        new RsaKey(publicRsaParameters, { kid: 'rsa-key', use: 'sig' }),
      ]);

      expect(jwks.toJSON(false)).toStrictEqual<JsonWebKeySetParameters>({
        keys: [
          { ...privateEllipticCurveParameters, kid: 'ec-key', use: 'sig' },
          { ...publicRsaParameters, kid: 'rsa-key', use: 'sig' },
        ],
      });
    });
  });
});
