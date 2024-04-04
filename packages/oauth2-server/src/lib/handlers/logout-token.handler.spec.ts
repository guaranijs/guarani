import { DependencyInjectionContainer } from '@guarani/di';
import {
  EllipticCurveKey,
  JsonWebEncryption,
  JsonWebKeyNotFoundException,
  JsonWebKeySet,
  JsonWebSignature,
  RsaKey,
} from '@guarani/jose';
import { Dictionary } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { Login } from '../entities/login.entity';
import { User } from '../entities/user.entity';
import { Logger } from '../logger/logger';
import { LogoutTokenClaims } from '../logout-token/logout-token.claims';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { LogoutTokenHandler } from './logout-token.handler';

jest.mock('../logger/logger');

describe('Logout Token Handler', () => {
  let container: DependencyInjectionContainer;
  let logoutTokenHandler: LogoutTokenHandler;

  const ecSignkey = new EllipticCurveKey({
    kty: 'EC',
    crv: 'P-256',
    x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
    y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
    d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
    alg: 'ES256',
    kid: 'ec-sign-key',
    use: 'sig',
  });

  const rsaSignKey = new RsaKey({
    kty: 'RSA',
    n:
      'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
      'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
      'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
      'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
      'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
      '5JG5iK0nsm1uZYu-02XN-w',
    e: 'AQAB',
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
    alg: 'RS256',
    kid: 'rsa-sign-key',
    use: 'sig',
  });

  const rsaKeyWrapKey = new RsaKey({
    kty: 'RSA',
    n:
      'sXchDaQebHnPiGvyDOAT4saGEUetSyo9MKLOoWFsueri23bOdgWp4Dy1WlUzewbg' +
      'BHod5pcM9H95GQRV3JDXboIRROSBigeC5yjU1hGzHHyXss8UDprecbAYxknTcQkh' +
      'slANGRUZmdTOQ5qTRsLAt6BTYuyvVRdhS8exSZEy_c4gs_7svlJJQ4H9_NxsiIoL' +
      'wAEk7-Q3UXERGYw_75IDrGA84-lA_-Ct4eTlXHBIY2EaV7t7LjJaynVJCpkv4LKj' +
      'TTAumiGUIuQhrNhZLuF_RJLqHpM2kgWFLU7-VTdL1VbC2tejvcI2BlMkEpk1BzBZ' +
      'I0KQB0GaDWFLN-aEAw3vRw',
    e: 'AQAB',
    d:
      'VFCWOqXr8nvZNyaaJLXdnNPXZKRaWCjkU5Q2egQQpTBMwhprMzWzpR8Sxq1OPThh' +
      '_J6MUD8Z35wky9b8eEO0pwNS8xlh1lOFRRBoNqDIKVOku0aZb-rynq8cxjDTLZQ6' +
      'Fz7jSjR1Klop-YKaUHc9GsEofQqYruPhzSA-QgajZGPbE_0ZaVDJHfyd7UUBUKun' +
      'FMScbflYAAOYJqVIVwaYR5zWEEceUjNnTNo_CVSj-VvXLO5VZfCUAVLgW4dpf1Sr' +
      'tZjSt34YLsRarSb127reG_DUwg9Ch-KyvjT1SkHgUWRVGcyly7uvVGRSDwsXypdr' +
      'NinPA4jlhoNdizK2zF2CWQ',
    p:
      '9gY2w6I6S6L0juEKsbeDAwpd9WMfgqFoeA9vEyEUuk4kLwBKcoe1x4HG68ik918h' +
      'dDSE9vDQSccA3xXHOAFOPJ8R9EeIAbTi1VwBYnbTp87X-xcPWlEPkrdoUKW60tgs' +
      '1aNd_Nnc9LEVVPMS390zbFxt8TN_biaBgelNgbC95sM',
    q:
      'uKlCKvKv_ZJMVcdIs5vVSU_6cPtYI1ljWytExV_skstvRSNi9r66jdd9-yBhVfuG' +
      '4shsp2j7rGnIio901RBeHo6TPKWVVykPu1iYhQXw1jIABfw-MVsN-3bQ76WLdt2S' +
      'DxsHs7q7zPyUyHXmps7ycZ5c72wGkUwNOjYelmkiNS0',
    dp:
      'w0kZbV63cVRvVX6yk3C8cMxo2qCM4Y8nsq1lmMSYhG4EcL6FWbX5h9yuvngs4iLE' +
      'Fk6eALoUS4vIWEwcL4txw9LsWH_zKI-hwoReoP77cOdSL4AVcraHawlkpyd2TWjE' +
      '5evgbhWtOxnZee3cXJBkAi64Ik6jZxbvk-RR3pEhnCs',
    dq:
      'o_8V14SezckO6CNLKs_btPdFiO9_kC1DsuUTd2LAfIIVeMZ7jn1Gus_Ff7B7IVx3' +
      'p5KuBGOVF8L-qifLb6nQnLysgHDh132NDioZkhH7mI7hPG-PYE_odApKdnqECHWw' +
      '0J-F0JWnUd6D2B_1TvF9mXA2Qx-iGYn8OVV1Bsmp6qU',
    qi:
      'eNho5yRBEBxhGBtQRww9QirZsB66TrfFReG_CcteI1aCneT0ELGhYlRlCtUkTRcl' +
      'IfuEPmNsNDPbLoLqqCVznFbvdB7x-Tl-m0l_eFTj2KiqwGqE9PZB9nNTwMVvH3VR' +
      'RSLWACvPnSiwP8N5Usy-WRXS-V7TbpxIhvepTfE0NNo',
    alg: 'RSA-OAEP',
    kid: 'rsa-keywrap-key',
    use: 'enc',
  });

  const jwks = new JsonWebKeySet([ecSignkey, rsaSignKey]);

  const loggerMock = jest.mocked(Logger.prototype);

  const settings = <Settings>{ issuer: 'https://server.example.com', idTokenSignatureAlgorithms: ['ES256', 'RS256'] };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(JsonWebKeySet).toValue(jwks);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(LogoutTokenHandler).toSelf().asSingleton();

    logoutTokenHandler = container.resolve(LogoutTokenHandler);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generateLogoutToken()', () => {
    it('should throw when both "user" and "login" parameters are null.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      await expect(logoutTokenHandler.generateLogoutToken(client, null, null)).rejects.toThrowWithMessage(
        TypeError,
        'You must provide at least one of "user" and "login".',
      );
    });

    it('should throw when no signing key has an "alg" parameter supported by the client.', async () => {
      const keysWithUnsupportedAlg = await Promise.all([
        EllipticCurveKey.generate('EC', { curve: 'P-384' }, { alg: 'ES384' }),
        RsaKey.generate('RSA', { modulus: 2048 }, { alg: 'RS384' }),
      ]);

      container.delete(JsonWebKeySet);
      container.delete(LogoutTokenHandler);

      container.bind(JsonWebKeySet).toValue(new JsonWebKeySet(keysWithUnsupportedAlg));
      container.bind(LogoutTokenHandler).toSelf().asSingleton();

      logoutTokenHandler = container.resolve(LogoutTokenHandler);

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      await expect(logoutTokenHandler.generateLogoutToken(client, user, login)).rejects.toThrowWithMessage(
        JsonWebKeyNotFoundException,
        'No JSON Web Key matches the criteria at the JSON Web Key Set.',
      );
    });

    it('should throw when no signing key has "sig" as its "use" parameter.', async () => {
      const keysWithInvalidSig = await Promise.all([
        EllipticCurveKey.generate('EC', { curve: 'P-256' }, { alg: 'ES256' }),
        RsaKey.generate('RSA', { modulus: 2048 }, { alg: 'RS256', use: 'enc' }),
      ]);

      container.delete(JsonWebKeySet);
      container.delete(LogoutTokenHandler);

      container.bind(JsonWebKeySet).toValue(new JsonWebKeySet(keysWithInvalidSig));
      container.bind(LogoutTokenHandler).toSelf().asSingleton();

      logoutTokenHandler = container.resolve(LogoutTokenHandler);

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), { id: 'client_id' });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      await expect(logoutTokenHandler.generateLogoutToken(client, user, login)).rejects.toThrowWithMessage(
        JsonWebKeyNotFoundException,
        'No JSON Web Key matches the criteria at the JSON Web Key Set.',
      );
    });

    it('should generate a signed logout token with the default claims.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
        idTokenSignedResponseAlgorithm: 'ES256',
        idTokenEncryptedResponseKeyWrap: null,
      });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      const logoutToken = await logoutTokenHandler.generateLogoutToken(client, user, login);

      expect(logoutToken).toEqual(expect.any(String));

      const { payload } = await JsonWebSignature.verify(
        logoutToken,
        async (header) => jwks.find((jwk) => jwk.kid === header.kid)!,
        ['ES256', 'RS256'],
      );

      const claims = new LogoutTokenClaims(JSON.parse(payload.toString('utf8')));

      expect(claims.nonce).toBeUndefined();
      expect(claims.sub).toEqual(user.id);
      expect(claims.sid).toEqual(login.id);
      expect(claims.events).toStrictEqual<{ 'http://schemas.openid.net/event/backchannel-logout': Dictionary<never> }>({
        'http://schemas.openid.net/event/backchannel-logout': {},
      });
    });

    it('should generate a signed logout token with the default claims and no "sub" claim.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
        idTokenSignedResponseAlgorithm: 'ES256',
        idTokenEncryptedResponseKeyWrap: null,
      });

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      const logoutToken = await logoutTokenHandler.generateLogoutToken(client, null, login);

      expect(logoutToken).toEqual(expect.any(String));

      const { payload } = await JsonWebSignature.verify(
        logoutToken,
        async (header) => jwks.find((jwk) => jwk.kid === header.kid)!,
        ['ES256', 'RS256'],
      );

      const claims = new LogoutTokenClaims(JSON.parse(payload.toString('utf8')));

      expect(claims.nonce).toBeUndefined();
      expect(claims.sub).toBeUndefined();
      expect(claims.sid).toEqual(login.id);
      expect(claims.events).toStrictEqual<{ 'http://schemas.openid.net/event/backchannel-logout': Dictionary<never> }>({
        'http://schemas.openid.net/event/backchannel-logout': {},
      });
    });

    it('should generate a signed logout token with the default claims and no "sid" claim.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        subjectType: 'public',
        idTokenSignedResponseAlgorithm: 'ES256',
        idTokenEncryptedResponseKeyWrap: null,
      });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const logoutToken = await logoutTokenHandler.generateLogoutToken(client, user, null);

      expect(logoutToken).toEqual(expect.any(String));

      const { payload } = await JsonWebSignature.verify(
        logoutToken,
        async (header) => jwks.find((jwk) => jwk.kid === header.kid)!,
        ['ES256', 'RS256'],
      );

      const claims = new LogoutTokenClaims(JSON.parse(payload.toString('utf8')));

      expect(claims.nonce).toBeUndefined();
      expect(claims.sub).toEqual(user.id);
      expect(claims.sid).toBeUndefined();
      expect(claims.events).toStrictEqual<{ 'http://schemas.openid.net/event/backchannel-logout': Dictionary<never> }>({
        'http://schemas.openid.net/event/backchannel-logout': {},
      });
    });

    it('should throw when the client does not have a json web key set registered.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        jwksUri: null,
        jwks: null,
        subjectType: 'public',
        idTokenSignedResponseAlgorithm: 'ES256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128CBC-HS256',
      });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      await expect(logoutTokenHandler.generateLogoutToken(client, user, login)).rejects.toThrowWithMessage(
        Error,
        'The Client does not have a JSON Web Key Set registered.',
      );
    });

    it('should throw when no key wrap key has an "alg" parameter supported by the client.', async () => {
      const keysWithUnsupportedAlg = await Promise.all([
        EllipticCurveKey.generate('EC', { curve: 'P-256' }, { alg: 'ES256', use: 'sig' }),
        RsaKey.generate('RSA', { modulus: 2048 }, { alg: 'RS256', use: 'sig' }),
        RsaKey.generate('RSA', { modulus: 2048 }, { alg: 'RSA-OAEP-256', use: 'enc' }),
      ]);

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        jwksUri: null,
        jwks: new JsonWebKeySet(keysWithUnsupportedAlg).toJSON(true),
        subjectType: 'public',
        idTokenSignedResponseAlgorithm: 'ES256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128CBC-HS256',
      });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      await expect(logoutTokenHandler.generateLogoutToken(client, user, login)).rejects.toThrowWithMessage(
        JsonWebKeyNotFoundException,
        'No JSON Web Key matches the criteria at the JSON Web Key Set.',
      );
    });

    it('should throw when no key wrap key has "enc" as its "use" parameter.', async () => {
      const keysWithInvalidSig = await Promise.all([
        EllipticCurveKey.generate('EC', { curve: 'P-256' }, { alg: 'ES256', use: 'sig' }),
        RsaKey.generate('RSA', { modulus: 2048 }, { alg: 'RS256', use: 'sig' }),
        RsaKey.generate('RSA', { modulus: 2048 }, { alg: 'RSA-OAEP-256' }),
      ]);

      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        jwksUri: null,
        jwks: new JsonWebKeySet(keysWithInvalidSig).toJSON(true),
        subjectType: 'public',
        idTokenSignedResponseAlgorithm: 'ES256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128CBC-HS256',
      });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      await expect(logoutTokenHandler.generateLogoutToken(client, user, login)).rejects.toThrowWithMessage(
        JsonWebKeyNotFoundException,
        'No JSON Web Key matches the criteria at the JSON Web Key Set.',
      );
    });

    it('should generate a nested logout token with the default claims.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        jwksUri: null,
        jwks: new JsonWebKeySet([rsaKeyWrapKey]).toJSON(true),
        subjectType: 'public',
        idTokenSignedResponseAlgorithm: 'ES256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128CBC-HS256',
      });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      const logoutToken = await logoutTokenHandler.generateLogoutToken(client, user, login);

      expect(logoutToken).toEqual(expect.any(String));

      const { plaintext } = await JsonWebEncryption.decrypt(
        logoutToken,
        rsaKeyWrapKey,
        ['RSA-OAEP'],
        ['A128CBC-HS256'],
      );

      const { payload } = await JsonWebSignature.verify(
        plaintext.toString('ascii'),
        async (header) => jwks.find((jwk) => jwk.kid === header.kid)!,
        ['ES256', 'RS256'],
      );

      const claims = new LogoutTokenClaims(JSON.parse(payload.toString('utf8')));

      expect(claims.nonce).toBeUndefined();
      expect(claims.sub).toEqual(user.id);
      expect(claims.sid).toEqual(login.id);
      expect(claims.events).toStrictEqual<{ 'http://schemas.openid.net/event/backchannel-logout': Dictionary<never> }>({
        'http://schemas.openid.net/event/backchannel-logout': {},
      });
    });

    it('should generate a nested logout token with the default claims and no "sub" claim.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        jwksUri: null,
        jwks: new JsonWebKeySet([rsaKeyWrapKey]).toJSON(true),
        subjectType: 'public',
        idTokenSignedResponseAlgorithm: 'ES256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128CBC-HS256',
      });

      const login: Login = Object.assign<Login, Partial<Login>>(Reflect.construct(Login, []), { id: 'login_id' });

      const logoutToken = await logoutTokenHandler.generateLogoutToken(client, null, login);

      expect(logoutToken).toEqual(expect.any(String));

      const { plaintext } = await JsonWebEncryption.decrypt(
        logoutToken,
        rsaKeyWrapKey,
        ['RSA-OAEP'],
        ['A128CBC-HS256'],
      );

      const { payload } = await JsonWebSignature.verify(
        plaintext.toString('ascii'),
        async (header) => jwks.find((jwk) => jwk.kid === header.kid)!,
        ['ES256', 'RS256'],
      );

      const claims = new LogoutTokenClaims(JSON.parse(payload.toString('utf8')));

      expect(claims.nonce).toBeUndefined();
      expect(claims.sub).toBeUndefined();
      expect(claims.sid).toEqual(login.id);
      expect(claims.events).toStrictEqual<{ 'http://schemas.openid.net/event/backchannel-logout': Dictionary<never> }>({
        'http://schemas.openid.net/event/backchannel-logout': {},
      });
    });

    it('should generate a nested logout token with the default claims and no "sid" claim.', async () => {
      const client: Client = Object.assign<Client, Partial<Client>>(Reflect.construct(Client, []), {
        id: 'client_id',
        jwksUri: null,
        jwks: new JsonWebKeySet([rsaKeyWrapKey]).toJSON(true),
        subjectType: 'public',
        idTokenSignedResponseAlgorithm: 'ES256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128CBC-HS256',
      });

      const user: User = Object.assign<User, Partial<User>>(Reflect.construct(User, []), { id: 'user_id' });

      const logoutToken = await logoutTokenHandler.generateLogoutToken(client, user, null);

      expect(logoutToken).toEqual(expect.any(String));

      const { plaintext } = await JsonWebEncryption.decrypt(
        logoutToken,
        rsaKeyWrapKey,
        ['RSA-OAEP'],
        ['A128CBC-HS256'],
      );

      const { payload } = await JsonWebSignature.verify(
        plaintext.toString('ascii'),
        async (header) => jwks.find((jwk) => jwk.kid === header.kid)!,
        ['ES256', 'RS256'],
      );

      const claims = new LogoutTokenClaims(JSON.parse(payload.toString('utf8')));

      expect(claims.nonce).toBeUndefined();
      expect(claims.sub).toEqual(user.id);
      expect(claims.sid).toBeUndefined();
      expect(claims.events).toStrictEqual<{ 'http://schemas.openid.net/event/backchannel-logout': Dictionary<never> }>({
        'http://schemas.openid.net/event/backchannel-logout': {},
      });
    });
  });
});
