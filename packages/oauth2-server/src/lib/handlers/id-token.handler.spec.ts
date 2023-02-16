import { DependencyInjectionContainer } from '@guarani/di';
import { JsonWebKey, JsonWebKeySet, JsonWebSignature } from '@guarani/jose';

import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Consent } from '../entities/consent.entity';
import { IdTokenClaims } from '../id-token/id-token.claims';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { IdTokenHandler } from './id-token.handler';

const consent = <Consent>{
  client: { id: 'client_id' },
  parameters: { nonce: 'nonce' },
  scopes: ['openid', 'profile', 'email', 'phone', 'address'],
  user: { id: 'user_id' },
};

const accessToken = <AccessToken>{ handle: 'access_token' };
const authorizationCode = <AuthorizationCode>{ code: 'authorization_code' };

describe('ID Token Handler', () => {
  let idTokenHandler: IdTokenHandler;

  const eckey = new JsonWebKey({
    kty: 'EC',
    crv: 'P-256',
    x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
    y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
    d: 'bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo',
    alg: 'ES256',
    kid: 'ec-key',
    use: 'sig',
  });

  const rsaKey = new JsonWebKey({
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
    kid: 'rsa-key',
    use: 'sig',
  });

  const jwks = new JsonWebKeySet([eckey, rsaKey]);
  const settings = <Settings>{ issuer: 'https://server.example.com' };

  const userServiceMock = jest.mocked<UserServiceInterface>(
    {
      findOne: jest.fn(),
      getUserinfo: jest.fn(),
    },
    true
  );

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(JsonWebKeySet).toValue(jwks);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);
    container.bind(IdTokenHandler).toSelf().asSingleton();

    idTokenHandler = container.resolve(IdTokenHandler);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it(`should reject not implementing user service's "getUserInfo()".`, () => {
    expect(() => {
      return new IdTokenHandler(jwks, settings, <any>{});
    }).toThrow(new TypeError('Missing implementation of required method "UserServiceInterface.getUserinfo".'));
  });

  it('should generate an id token with the default claims.', async () => {
    userServiceMock.getUserinfo!.mockResolvedValueOnce({ sub: 'user_id' });

    const idToken = await idTokenHandler.generateIdToken(consent);

    expect(idToken).toEqual(expect.any(String));

    await expect(
      JsonWebSignature.verify(idToken, async (header) => jwks.find((jwk) => jwk.kid === header.kid)!)
    ).resolves.not.toThrow();
  });

  it('should generate an id token with the default claims and the "at_hash" claim.', async () => {
    userServiceMock.getUserinfo!.mockResolvedValueOnce({ sub: 'user_id' });

    const idToken = await idTokenHandler.generateIdToken(consent, accessToken);

    expect(idToken).toEqual(expect.any(String));

    const { payload } = await JsonWebSignature.verify(
      idToken,
      async (header) => jwks.find((jwk) => jwk.kid === header.kid)!
    );

    const claims = new IdTokenClaims(JSON.parse(payload.toString('utf8')));

    expect(claims).toHaveProperty('at_hash');
    expect(claims.at_hash).toEqual('hrOQHuo3oE6FR82RIiX1SA');
  });

  it('should generate an id token with the default claims and the "c_hash" claim.', async () => {
    userServiceMock.getUserinfo!.mockResolvedValueOnce({ sub: 'user_id' });

    const idToken = await idTokenHandler.generateIdToken(consent, undefined, authorizationCode);

    expect(idToken).toEqual(expect.any(String));

    const { payload } = await JsonWebSignature.verify(
      idToken,
      async (header) => jwks.find((jwk) => jwk.kid === header.kid)!
    );

    const claims = new IdTokenClaims(JSON.parse(payload.toString('utf8')));

    expect(claims).toHaveProperty('c_hash');
    expect(claims.c_hash).toEqual('pk3JJWstBOegJTRDDozDaw');
  });

  it('should generate an id token with the default claims and the "at_hash" and "c_hash" claims.', async () => {
    userServiceMock.getUserinfo!.mockResolvedValueOnce({ sub: 'user_id' });

    const idToken = await idTokenHandler.generateIdToken(consent, accessToken, authorizationCode);

    expect(idToken).toEqual(expect.any(String));

    const { payload } = await JsonWebSignature.verify(
      idToken,
      async (header) => jwks.find((jwk) => jwk.kid === header.kid)!
    );

    const claims = new IdTokenClaims(JSON.parse(payload.toString('utf8')));

    expect(claims).toHaveProperty('at_hash');
    expect(claims).toHaveProperty('c_hash');

    expect(claims.at_hash).toEqual('hrOQHuo3oE6FR82RIiX1SA');
    expect(claims.c_hash).toEqual('pk3JJWstBOegJTRDDozDaw');
  });
});