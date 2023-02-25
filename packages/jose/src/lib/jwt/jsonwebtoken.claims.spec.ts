import { Buffer } from 'buffer';

import { InvalidJsonWebTokenClaimException } from '../exceptions/invalid-jsonwebtoken-claim.exception';
import { JsonWebTokenClaims } from './jsonwebtoken.claims';

const invalidIss: unknown[] = [null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol('a'), () => 1, {}, [], Buffer];
const invalidSubs: unknown[] = [...invalidIss];
const invalidAuds: unknown[] = [null, true, 1, 1.2, 1n, Buffer.alloc(1), Symbol('a'), () => 1, {}, Buffer];
const invalidExps: unknown[] = [null, true, 1.2, 1n, 'a', Buffer.alloc(1), Symbol('a'), () => 1, {}, [], Buffer];
const invalidNbfs: unknown[] = [...invalidExps];
const invalidIats: unknown[] = [...invalidExps];
const invalidJtis: unknown[] = [...invalidIss];

describe('JSON Web Token Claims', () => {
  describe('constructor', () => {
    it.each(invalidIss)('should throw when the provided claim "iss" is invalid.', (iss) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebTokenClaims({ iss })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iss".')
      );
    });

    it.each(invalidSubs)('should throw when the provided claim "sub" is invalid.', (sub) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebTokenClaims({ sub })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "sub".')
      );
    });

    it.each([...invalidAuds, ...invalidAuds.map((aud) => [aud])])(
      'should throw when the provided claim "aud" is invalid.',
      (aud) =>
        // @ts-expect-error Invalid Type
        expect(() => new JsonWebTokenClaims({ aud })).toThrow(
          new InvalidJsonWebTokenClaimException('Invalid claim "aud".')
        )
    );

    it.each(invalidExps)('should throw when the provided claim "exp" is invalid.', (exp) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebTokenClaims({ exp })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "exp".')
      );
    });

    it.each(invalidNbfs)('should throw when the provided claim "nbf" is invalid.', (nbf) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebTokenClaims({ nbf })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "nbf".')
      );
    });

    it.each(invalidIats)('should throw when the provided claim "iat" is invalid.', (iat) => {
      // @ts-expect-error Invalid Type
      expect(() => new JsonWebTokenClaims({ iat })).toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iat".')
      );
    });

    it.each(invalidJtis)('should throw when the provided claim "jti" is invalid.', (jti) => {
      // @ts-expect-error Invalid Type
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
