import { InvalidJsonWebTokenClaimException } from '@guarani/jose';

import { IdTokenClaims } from './id-token.claims';
import { IdTokenClaimsParameters } from './id-token.claims.parameters';

const now = Math.floor(Date.now() / 1000);

const invalidSids: any[] = [undefined, null, true, 1, 1.2, '', {}, []];
const invalidAuthTimes: any[] = [null, true, 1.2, '', {}, []];
const invalidNonces: any[] = [null, true, 1, 1.2, '', {}, []];
const invalidAcrs: any[] = [null, true, 1, 1.2, '', {}, []];
const invalidAmrs: any[] = [null, true, 1, 1.2, '', {}, [], [null, true, 1, 1.2, '', {}, []]];
const invalidAzps: any[] = [null, true, 1, 1.2, '', {}, []];
const invalidAtHashes: any[] = [null, true, 1, 1.2, '', {}, []];
const invalidCHashes: any[] = [null, true, 1, 1.2, '', {}, []];

describe('ID Token Claims', () => {
  describe('parse()', () => {
    it('should throw when not providing the claim "iss".', async () => {
      const data = Buffer.from(JSON.stringify({}), 'utf8');

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iss".'),
      );
    });

    it('should throw when not providing the claim "sub".', async () => {
      const data = Buffer.from(JSON.stringify({ iss: 'https://server.example.com' }), 'utf8');

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "sub".'),
      );
    });

    it('should throw when not providing the claim "aud".', async () => {
      const data = Buffer.from(JSON.stringify({ iss: 'https://server.example.com', sub: 'user_id' }), 'utf8');

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "aud".'),
      );
    });

    it('should throw when not providing the claim "exp".', async () => {
      const data = Buffer.from(
        JSON.stringify({ iss: 'https://server.example.com', sub: 'user_id', aud: 'client_id' }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "exp".'),
      );
    });

    it('should throw when not providing the claim "iat".', async () => {
      const data = Buffer.from(
        JSON.stringify({ iss: 'https://server.example.com', sub: 'user_id', aud: 'client_id', exp: now + 3600 }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iat".'),
      );
    });

    it('should throw when not providing the claim "iat".', async () => {
      const data = Buffer.from(
        JSON.stringify({ iss: 'https://server.example.com', sub: 'user_id', aud: 'client_id', exp: now + 3600 }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "iat".'),
      );
    });

    it.each(invalidSids)('should throw when the provided claim "sid" is invalid.', async (sid) => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          sub: 'user_id',
          aud: 'client_id',
          exp: now + 3600,
          iat: now,
          sid,
        }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "sid".'),
      );
    });

    it.each(invalidAuthTimes)('should throw when the provided claim "auth_time" is invalid.', async (authTime) => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          sub: 'user_id',
          aud: 'client_id',
          exp: now + 3600,
          iat: now,
          sid: 'login_id',
          auth_time: authTime,
        }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "auth_time".'),
      );
    });

    it.each(invalidNonces)('should throw when the provided claim "nonce" is invalid.', async (nonce) => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          sub: 'user_id',
          aud: 'client_id',
          exp: now + 3600,
          iat: now,
          sid: 'login_id',
          auth_time: now,
          nonce,
        }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "nonce".'),
      );
    });

    it.each(invalidAcrs)('should throw when the provided claim "acr" is invalid.', async (acr) => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          sub: 'user_id',
          aud: 'client_id',
          exp: now + 3600,
          iat: now,
          sid: 'login_id',
          auth_time: now,
          nonce: 'nonce',
          acr,
        }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "acr".'),
      );
    });

    it.each(invalidAmrs)('should throw when the provided claim "amr" is invalid.', async (amr) => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          sub: 'user_id',
          aud: 'client_id',
          exp: now + 3600,
          iat: now,
          sid: 'login_id',
          auth_time: now,
          nonce: 'nonce',
          acr: 'urn:guarani:acr:2fa',
          amr,
        }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "amr".'),
      );
    });

    it.each(invalidAzps)('should throw when the provided claim "azp" is invalid.', async (azp) => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          sub: 'user_id',
          aud: 'client_id',
          exp: now + 3600,
          iat: now,
          sid: 'login_id',
          auth_time: now,
          nonce: 'nonce',
          acr: 'urn:guarani:acr:2fa',
          amr: ['pwd', 'sms'],
          azp,
        }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "azp".'),
      );
    });

    it.each(invalidAtHashes)('should throw when the provided claim "at_hash" is invalid.', async (atHash) => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          sub: 'user_id',
          aud: 'client_id',
          exp: now + 3600,
          iat: now,
          sid: 'login_id',
          auth_time: now,
          nonce: 'nonce',
          acr: 'urn:guarani:acr:2fa',
          amr: ['pwd', 'sms'],
          azp: 'client_id',
          at_hash: atHash,
        }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "at_hash".'),
      );
    });

    it.each(invalidCHashes)('should throw when the provided claim "c_hash" is invalid.', async (cHash) => {
      const data = Buffer.from(
        JSON.stringify({
          iss: 'https://server.example.com',
          sub: 'user_id',
          aud: 'client_id',
          exp: now + 3600,
          iat: now,
          sid: 'login_id',
          auth_time: now,
          nonce: 'nonce',
          acr: 'urn:guarani:acr:2fa',
          amr: ['pwd', 'sms'],
          azp: 'client_id',
          at_hash: 'at_hash',
          c_hash: cHash,
        }),
        'utf8',
      );

      await expect(IdTokenClaims.parse(data)).rejects.toThrow(
        new InvalidJsonWebTokenClaimException('Invalid claim "c_hash".'),
      );
    });

    it('should create an instance of id token claims.', async () => {
      const claims: IdTokenClaimsParameters = {
        iss: 'https://server.example.com',
        sub: 'user_id',
        aud: 'client_id',
        exp: now + 3600,
        iat: now,
        sid: 'login_id',
        auth_time: now,
        nonce: 'nonce',
        acr: 'urn:guarani:acr:2fa',
        amr: ['pwd', 'sms'],
        azp: 'client_id',
        at_hash: 'at_hash',
        c_hash: 'c_hash',
      };

      const data = Buffer.from(JSON.stringify(claims), 'utf8');

      await expect(IdTokenClaims.parse(data)).resolves.toMatchObject(claims);
    });
  });
});
