import { InvalidJsonWebTokenClaimException, InvalidJsonWebTokenClaimsException } from '@guarani/jose';

import { LogoutTokenClaims } from './logout-token.claims';
import { LogoutTokenClaimsParameters } from './logout-token.claims.parameters';

const now = Math.floor(Date.now() / 1000);

const invalidEvents: any[] = [null, true, 1, 1.2, '', {}, { 'http://schemas.openid.net/event/backchannel-logout': '' }];
const invalidSids: any[] = [null, true, 1, 1.2, '', {}, []];

describe('Logout Token Claims', () => {
  describe('parse()', () => {
    it('should throw when not providing the claim "iss".', async () => {
      const data = Buffer.from(JSON.stringify({ aud: 'client_id', iat: now }), 'utf8');

      await expect(LogoutTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iss".'),
      );
    });

    it('should throw when not providing the claim "aud".', async () => {
      const data = Buffer.from(JSON.stringify({ iss: 'https://server.example.com', iat: now }), 'utf8');

      await expect(LogoutTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "aud".'),
      );
    });

    it('should throw when not providing the claim "iat".', async () => {
      const data = Buffer.from(JSON.stringify({ iss: 'https://server.example.com', aud: 'client_id' }), 'utf8');

      await expect(LogoutTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iat".'),
      );
    });

    it.each(invalidEvents)('should throw when providing an invalid "events" claim.', async (events) => {
      const data = Buffer.from(
        JSON.stringify({ iss: 'https://server.example.com', aud: 'client_id', iat: now, events }),
        'utf8',
      );

      await expect(LogoutTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "events".'),
      );
    });

    it('should throw when not providing one of "sub" and / or "sid" claims.', async () => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          aud: 'client_id',
          iat: now,
          events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
        }),
        'utf8',
      );

      await expect(LogoutTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimsException('Missing at least one of the claims "sub" and "sid".'),
      );
    });

    it.each(invalidSids)('should throw when providing an invalid "sid" claim.', async (sid) => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          aud: 'client_id',
          iat: now,
          events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
          sid,
        }),
        'utf8',
      );

      await expect(LogoutTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "sid".'),
      );
    });

    it('should throw when providing the "nonce" claim.', async () => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          aud: 'client_id',
          iat: now,
          events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
          sid: 'login_id',
          nonce: 'nonce',
        }),
        'utf8',
      );

      await expect(LogoutTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Prohibited claim "nonce".'),
      );
    });

    it('should create an instance of logout token claims.', async () => {
      const claims: LogoutTokenClaimsParameters = {
        iss: 'https://server.example.com',
        aud: 'client_id',
        iat: now,
        events: { 'http://schemas.openid.net/event/backchannel-logout': {} },
        sid: 'login_id',
      };

      const data = Buffer.from(JSON.stringify(claims), 'utf8');

      await expect(LogoutTokenClaims.parse(data)).resolves.toMatchObject(claims);
    });
  });
});
