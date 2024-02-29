import { Buffer } from 'buffer';

import { InvalidJsonWebTokenClaimException } from '@guarani/jose';

import { AuthorizationResponseTokenClaims } from './authorization-response-token.claims';
import { AuthorizationResponseTokenClaimsParameters } from './authorization-response-token.claims.parameters';

const now = Math.floor(Date.now() / 1000);

describe('Authorization Response Token Claims', () => {
  describe('parse()', () => {
    it('should throw when not providing the claim "iss".', async () => {
      const data = Buffer.from(JSON.stringify({ aud: 'client_id', exp: now + 3600, iat: now }), 'utf8');

      await expect(AuthorizationResponseTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iss".'),
      );
    });

    it('should throw when not providing the claim "aud".', async () => {
      const data = Buffer.from(
        JSON.stringify({ iss: 'https://server.example.com', exp: now + 3600, iat: now }),
        'utf8',
      );

      await expect(AuthorizationResponseTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "aud".'),
      );
    });

    it('should throw when not providing the claim "exp".', async () => {
      const data = Buffer.from(
        JSON.stringify({ iss: 'https://server.example.com', aud: 'client_id', iat: now }),
        'utf8',
      );

      await expect(AuthorizationResponseTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "exp".'),
      );
    });

    it('should throw when not providing the claim "iat".', async () => {
      const data = Buffer.from(
        JSON.stringify({ iss: 'https://server.example.com', aud: 'client_id', exp: now + 3600 }),
        'utf8',
      );

      await expect(AuthorizationResponseTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iat".'),
      );
    });

    it('should create an instance of jwt authorization response token claims.', async () => {
      const claims: AuthorizationResponseTokenClaimsParameters = {
        iss: 'https://server.example.com',
        aud: 'client_id',
        exp: now + 3600,
        iat: now,
      };

      const data = Buffer.from(JSON.stringify(claims), 'utf8');

      await expect(AuthorizationResponseTokenClaims.parse(data)).resolves.toMatchObject(claims);
    });
  });
});
