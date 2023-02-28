import { Buffer } from 'buffer';

import { InvalidJsonWebTokenClaimException } from '../exceptions/invalid-jsonwebtoken-claim.exception';
import { JsonWebTokenClaims } from './jsonwebtoken.claims';

const invalidIss: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidSubs: any[] = [...invalidIss];
const invalidAuds: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}];
const invalidExps: any[] = [null, true, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, {}, []];
const invalidNbfs: any[] = [...invalidExps];
const invalidIats: any[] = [...invalidExps];
const invalidJtis: any[] = [...invalidIss];

describe('JSON Web Token Claims', () => {
  describe('constructor', () => {
    it.each(invalidIss)('should throw when the provided claim "iss" is invalid.', (iss) => {
      expect(() => new JsonWebTokenClaims({ iss })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iss".')
      );
    });

    it.each(invalidSubs)('should throw when the provided claim "sub" is invalid.', (sub) => {
      expect(() => new JsonWebTokenClaims({ sub })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "sub".')
      );
    });

    it.each([...invalidAuds, ...invalidAuds.map((aud) => [aud])])(
      'should throw when the provided claim "aud" is invalid.',
      (aud) =>
        expect(() => new JsonWebTokenClaims({ aud })).toThrow(
          new InvalidJsonWebTokenClaimException('Invalid claim "aud".')
        )
    );

    it.each(invalidExps)('should throw when the provided claim "exp" is invalid.', (exp) => {
      expect(() => new JsonWebTokenClaims({ exp })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "exp".')
      );
    });

    it.each(invalidNbfs)('should throw when the provided claim "nbf" is invalid.', (nbf) => {
      expect(() => new JsonWebTokenClaims({ nbf })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "nbf".')
      );
    });

    it.each(invalidIats)('should throw when the provided claim "iat" is invalid.', (iat) => {
      expect(() => new JsonWebTokenClaims({ iat })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iat".')
      );
    });

    it.each(invalidJtis)('should throw when the provided claim "jti" is invalid.', (jti) => {
      expect(() => new JsonWebTokenClaims({ jti })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "jti".')
      );
    });

    it('should call validateCustomClaims() if defined.', () => {
      class CustomClaims extends JsonWebTokenClaims {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
        public override validateCustomClaims(_claims: Record<string, unknown>): void {}
      }

      const validateCustomClaimsSpy = jest.spyOn(CustomClaims.prototype, 'validateCustomClaims');

      expect(() => new CustomClaims({})).not.toThrow();
      expect(validateCustomClaimsSpy).toHaveBeenCalled();
    });

    it.todo('should test validateClaimsOptions()');

    it('should create an instance of json web token claims.', () => {
      const claims = { iss: 'https://example.com', sub: '1234' };

      expect(new JsonWebTokenClaims(claims)).toMatchObject(claims);
    });
  });
});
