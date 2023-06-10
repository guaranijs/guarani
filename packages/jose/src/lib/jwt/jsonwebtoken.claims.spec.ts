import { Buffer } from 'buffer';

import { InvalidJsonWebTokenClaimException } from '../exceptions/invalid-jsonwebtoken-claim.exception';
import { JsonWebTokenClaims } from './jsonwebtoken.claims';
import { JsonWebTokenClaimsParameters } from './jsonwebtoken.claims.parameters';
import { JsonWebTokenClaimsParseOptions } from './jsonwebtoken-claims-parse.options';

const invalidIss: any[] = [null, true, 1, 1.2, {}, []];
const invalidSubs: any[] = [null, true, 1, 1.2, {}, []];
const invalidAuds: any[] = [null, true, 1, 1.2, {}];
const invalidExps: any[] = [null, true, 1.2, 'a', {}, []];
const invalidNbfs: any[] = [null, true, 1.2, 'a', {}, []];
const invalidIats: any[] = [null, true, 1.2, 'a', {}, []];
const invalidJtis: any[] = [null, true, 1, 1.2, {}, []];
const invalidValuesOptions: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, () => 1, {}];
const valuesOptions: string[][][] = [[[]], [['https://example.org']], [['https://example.org', 'https://example.xyz']]];

describe('JSON Web Token Claims', () => {
  describe('parse()', () => {
    it.each(invalidIss)('should throw when the provided claim "iss" is invalid.', async (iss) => {
      const data = Buffer.from(JSON.stringify({ iss }), 'utf8');

      await expect(JsonWebTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iss".')
      );
    });

    it.each(invalidSubs)('should throw when the provided claim "sub" is invalid.', async (sub) => {
      const data = Buffer.from(JSON.stringify({ sub }), 'utf8');

      await expect(JsonWebTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "sub".')
      );
    });

    it.each([...invalidAuds, ...invalidAuds.map((aud) => [aud])])(
      'should throw when the provided claim "aud" is invalid.',
      async (aud) => {
        const data = Buffer.from(JSON.stringify({ aud }), 'utf8');

        await expect(JsonWebTokenClaims.parse(data)).rejects.toThrow(
          new InvalidJsonWebTokenClaimException('Invalid claim "aud".')
        );
      }
    );

    it.each(invalidExps)('should throw when the provided claim "exp" is invalid.', async (exp) => {
      const data = Buffer.from(JSON.stringify({ exp }), 'utf8');

      await expect(JsonWebTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "exp".')
      );
    });

    it.each(invalidNbfs)('should throw when the provided claim "nbf" is invalid.', async (nbf) => {
      const data = Buffer.from(JSON.stringify({ nbf }), 'utf8');

      await expect(JsonWebTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "nbf".')
      );
    });

    it.each(invalidIats)('should throw when the provided claim "iat" is invalid.', async (iat) => {
      const data = Buffer.from(JSON.stringify({ iat }), 'utf8');

      await expect(JsonWebTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iat".')
      );
    });

    it.each(invalidJtis)('should throw when the provided claim "jti" is invalid.', async (jti) => {
      const data = Buffer.from(JSON.stringify({ jti }), 'utf8');

      await expect(JsonWebTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "jti".')
      );
    });

    it('should call validateCustomClaims() if defined.', async () => {
      class CustomClaims extends JsonWebTokenClaims {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        public static override validateCustomClaims(_claims: JsonWebTokenClaimsParameters): void {}
      }

      const validateCustomClaimsSpy = jest.spyOn(CustomClaims, 'validateCustomClaims');

      const data = Buffer.from(JSON.stringify({}), 'utf8');

      await expect(CustomClaims.parse(data)).resolves.not.toThrow();

      expect(validateCustomClaimsSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw when providing both "value" and "values" validation options.', async () => {
      const claims: JsonWebTokenClaimsParameters = { iss: 'https://example.com' };
      const data = Buffer.from(JSON.stringify(claims), 'utf8');
      const options: JsonWebTokenClaimsParseOptions = {
        validationOptions: { iss: { value: 'https://example.com', values: ['https://example.com'] } },
      };

      await expect(JsonWebTokenClaims.parse(data, options)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Cannot have both "value" and "values" options for a claim.')
      );
    });

    it('should throw when not providing a required claim.', async () => {
      const claims: JsonWebTokenClaimsParameters = { iss: 'https://example.com' };
      const data = Buffer.from(JSON.stringify(claims), 'utf8');
      const options: JsonWebTokenClaimsParseOptions = {
        validationOptions: { sub: { essential: true } },
      };

      await expect(JsonWebTokenClaims.parse(data, options)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Missing required claim "sub".')
      );
    });

    it('should not throw when not providing an optional claim with a "value" option.', async () => {
      const claims: JsonWebTokenClaimsParameters = { iss: 'https://example.com' };
      const data = Buffer.from(JSON.stringify(claims), 'utf8');
      const options: JsonWebTokenClaimsParseOptions = {
        validationOptions: { sub: { essential: false, value: '1234' } },
      };

      await expect(JsonWebTokenClaims.parse(data, options)).resolves.not.toThrow();
    });

    it('should throw when providing an unexpected value for a claim with a "value" option.', async () => {
      const claims: JsonWebTokenClaimsParameters = { iss: 'https://example.com' };
      const data = Buffer.from(JSON.stringify(claims), 'utf8');
      const options: JsonWebTokenClaimsParseOptions = {
        validationOptions: { iss: { value: 'https://example.org' } },
      };

      await expect(JsonWebTokenClaims.parse(data, options)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Mismatching expected value for claim "iss".')
      );
    });

    it('should not throw when not providing an optional claim with a "values" option.', async () => {
      const claims: JsonWebTokenClaimsParameters = { iss: 'https://example.com' };
      const data = Buffer.from(JSON.stringify(claims), 'utf8');
      const options: JsonWebTokenClaimsParseOptions = {
        validationOptions: { sub: { essential: false, values: ['1234'] } },
      };

      await expect(JsonWebTokenClaims.parse(data, options)).resolves.not.toThrow();
    });

    it.each(invalidValuesOptions)(
      'should throw when not providing an array for the "values" option.',
      async (invalidValuesOption) => {
        const claims: JsonWebTokenClaimsParameters = { iss: 'https://example.com' };
        const data = Buffer.from(JSON.stringify(claims), 'utf8');
        const options: JsonWebTokenClaimsParseOptions = {
          validationOptions: { iss: { values: invalidValuesOption } },
        };

        await expect(JsonWebTokenClaims.parse(data, options)).rejects.toThrow(
          new InvalidJsonWebTokenClaimException('Expected an array for the option "values".')
        );
      }
    );

    it.each(valuesOptions)(
      'should throw when providing an unexpected value for a claim with a "values" option.',
      async (valuesOption) => {
        const claims: JsonWebTokenClaimsParameters = { iss: 'https://example.com' };
        const data = Buffer.from(JSON.stringify(claims), 'utf8');
        const options: JsonWebTokenClaimsParseOptions = {
          validationOptions: { iss: { values: valuesOption } },
        };

        await expect(JsonWebTokenClaims.parse(data, options)).rejects.toThrow(
          new InvalidJsonWebTokenClaimException('Mismatching expected value for claim "iss".')
        );
      }
    );

    it('should create an instance of json web token claims.', async () => {
      const claims: JsonWebTokenClaimsParameters = { iss: 'https://example.com', sub: '1234' };
      const data = Buffer.from(JSON.stringify(claims), 'utf8');

      await expect(JsonWebTokenClaims.parse(data)).resolves.toMatchObject(claims);
    });
  });
});
