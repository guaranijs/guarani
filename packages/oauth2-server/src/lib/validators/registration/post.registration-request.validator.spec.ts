import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { PostRegistrationContext } from '../../context/registration/post.registration-context';
import { AccessToken } from '../../entities/access-token.entity';
import { InsufficientScopeException } from '../../exceptions/insufficient-scope.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { InvalidTokenException } from '../../exceptions/invalid-token.exception';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { HttpMethod } from '../../http/http-method.type';
import { PostRegistrationRequest } from '../../requests/registration/post.registration-request';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../../services/access-token.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { PostRegistrationRequestValidator } from './post.registration-request.validator';

jest.mock('../../handlers/client-authorization.handler');
jest.mock('../../handlers/scope.handler');

const invalidBodies: any[] = [null, true, 1, 1.2, 'a', []];

describe('Post Registration Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: PostRegistrationRequestValidator;

  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype);

  const clientAuthorizationHandlerMock = jest.mocked(ClientAuthorizationHandler.prototype);

  const accessTokenServiceMock = jest.mocked<AccessTokenServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  });

  const settings = <Settings>{
    responseTypes: [
      'code',
      'code id_token',
      'code id_token token',
      'code token',
      'id_token',
      'id_token token',
      'token',
    ],
    grantTypes: [
      'authorization_code',
      'client_credentials',
      'password',
      'refresh_token',
      'urn:ietf:params:oauth:grant-type:device_code',
      'urn:ietf:params:oauth:grant-type:jwt-bearer',
    ],
    idTokenSignatureAlgorithms: ['ES256', 'HS256', 'RS256'],
    idTokenKeyWrapAlgorithms: ['A128KW', 'ECDH-ES', 'RSA-OAEP'],
    idTokenContentEncryptionAlgorithms: ['A128CBC-HS256', 'A128GCM'],
    userinfoSignatureAlgorithms: ['ES256', 'HS256', 'RS256'],
    userinfoKeyWrapAlgorithms: ['A128KW', 'ECDH-ES', 'RSA-OAEP'],
    userinfoContentEncryptionAlgorithms: ['A128CBC-HS256', 'A128GCM'],
    clientAuthenticationMethods: [
      'client_secret_basic',
      'client_secret_jwt',
      'client_secret_post',
      'none',
      'private_key_jwt',
    ],
    clientAuthenticationSignatureAlgorithms: ['ES256', 'HS256', 'RS256'],
    acrValues: ['guarani:acr:1fa', 'guarani:acr:2fa'],
    subjectTypes: ['pairwise', 'public'],
  };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ScopeHandler).toValue(scopeHandlerMock);
    container.bind(ClientAuthorizationHandler).toValue(clientAuthorizationHandlerMock);
    container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE).toValue(accessTokenServiceMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(PostRegistrationRequestValidator).toSelf().asSingleton();

    validator = container.resolve(PostRegistrationRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('httpMethod', () => {
    it('should have "POST" as its value.', () => {
      expect(validator.httpMethod).toEqual<HttpMethod>('POST');
    });
  });

  describe('expectedScopes', () => {
    it('should have ["client:manage", "client:create"] as its value.', () => {
      expect(validator.expectedScopes).toEqual<string[]>(['client:manage', 'client:create']);
    });
  });

  describe('validate()', () => {
    let parameters: PostRegistrationRequest;

    const requestFactory = (data: Partial<PostRegistrationRequest> = {}): HttpRequest => {
      removeNullishValues<PostRegistrationRequest>(Object.assign(parameters, data));

      const body = JSON.stringify(parameters);

      return new HttpRequest({
        body: Buffer.from(body, 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/register'),
      });
    };

    beforeEach(() => {
      parameters = {
        redirect_uris: ['https://client.example.com/oauth/callback'],
        response_types: ['code'],
        grant_types: ['authorization_code', 'refresh_token'],
        application_type: 'web',
        client_name: 'Test Client #1',
        scope: 'openid profile email phone address foo bar baz qux',
        contacts: ['johndoe@email.com'],
        logo_uri: 'https://some.cdn.com/client-logo.jpg',
        client_uri: 'https://client.example.com',
        policy_uri: 'https://client.example.com/policy',
        tos_uri: 'https://client.example.com/terms-of-service',
        jwks_uri: 'https://client.example.com/oauth/jwks',
        jwks: undefined,
        subject_type: 'pairwise',
        sector_identifier_uri: 'https://client.example.com/redirect_uris.json',
        id_token_signed_response_alg: 'RS256',
        id_token_encrypted_response_alg: 'RSA-OAEP',
        id_token_encrypted_response_enc: 'A128GCM',
        userinfo_signed_response_alg: 'RS256',
        userinfo_encrypted_response_alg: 'RSA-OAEP',
        userinfo_encrypted_response_enc: 'A128GCM',
        // request_object_signing_alg: '',
        // request_object_encryption_alg: '',
        // request_object_encryption_enc: '',
        token_endpoint_auth_method: 'private_key_jwt',
        token_endpoint_auth_signing_alg: 'RS256',
        default_max_age: 60 * 60 * 24 * 15,
        require_auth_time: true,
        default_acr_values: ['guarani:acr:2fa', 'guarani:acr:1fa'],
        initiate_login_uri: 'https://client.example.com/oauth/initiate',
        // request_uris: ,
        post_logout_redirect_uris: ['https://client.example.com/oauth/logout-callback'],
        software_id: 'TJ9C-X43C-95V1LK03',
        software_version: 'v1.4.37',
      };
    });

    it.each(invalidBodies)('should throw when not providing a plain object to the http request body.', async (body) => {
      const request = new HttpRequest({
        body: Buffer.from(JSON.stringify(body), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/register'),
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid Http Request Body.'
      );
    });

    it('should throw when the client fails the authorization process.', async () => {
      const request = requestFactory();

      const error = new InvalidTokenException('Lorem ipsum dolor sit amet...');

      clientAuthorizationHandlerMock.authorize.mockRejectedValueOnce(error);

      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it('should throw when providing an access token with a client.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{
        handle: 'access_token',
        client: { id: 'client_id' },
      };

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidTokenException,
        'Invalid Credentials.'
      );
    });

    it('should throw when not providing an initial access token.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{
        handle: 'access_token',
        client: null,
        scopes: ['foo', 'bar', 'baz', 'qux'],
      };

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InsufficientScopeException,
        'Invalid Credentials.'
      );
    });

    it('should return a post registration request context.', async () => {
      const request = requestFactory();

      const accessToken = <AccessToken>{
        handle: 'access_token',
        client: null,
        scopes: ['client:create'],
      };

      clientAuthorizationHandlerMock.authorize.mockResolvedValueOnce(accessToken);

      await expect(validator.validate(request)).resolves.toStrictEqual<PostRegistrationContext>({
        parameters,
        accessToken,
        redirectUris: [new URL('https://client.example.com/oauth/callback')],
        responseTypes: ['code'],
        grantTypes: ['authorization_code', 'refresh_token'],
        applicationType: 'web',
        clientName: 'Test Client #1',
        scopes: ['openid', 'profile', 'email', 'phone', 'address', 'foo', 'bar', 'baz', 'qux'],
        contacts: ['johndoe@email.com'],
        logoUri: new URL('https://some.cdn.com/client-logo.jpg'),
        clientUri: new URL('https://client.example.com'),
        policyUri: new URL('https://client.example.com/policy'),
        tosUri: new URL('https://client.example.com/terms-of-service'),
        jwksUri: new URL('https://client.example.com/oauth/jwks'),
        jwks: null,
        subjectType: 'pairwise',
        sectorIdentifierUri: new URL('https://client.example.com/redirect_uris.json'),
        idTokenSignedResponseAlgorithm: 'RS256',
        idTokenEncryptedResponseKeyWrap: 'RSA-OAEP',
        idTokenEncryptedResponseContentEncryption: 'A128GCM',
        userinfoSignedResponseAlgorithm: 'RS256',
        userinfoEncryptedResponseKeyWrap: 'RSA-OAEP',
        userinfoEncryptedResponseContentEncryption: 'A128GCM',
        // requestObjectSigningAlgorithm: ,
        // requestObjectEncryptionKeyWrap: ,
        // requestObjectEncryptionContentEncryption: ,
        authenticationMethod: 'private_key_jwt',
        authenticationSigningAlgorithm: 'RS256',
        defaultMaxAge: 60 * 60 * 24 * 15,
        requireAuthTime: true,
        defaultAcrValues: ['guarani:acr:2fa', 'guarani:acr:1fa'],
        initiateLoginUri: new URL('https://client.example.com/oauth/initiate'),
        // requestUris: ,
        postLogoutRedirectUris: [new URL('https://client.example.com/oauth/logout-callback')],
        softwareId: 'TJ9C-X43C-95V1LK03',
        softwareVersion: 'v1.4.37',
      });
    });
  });
});
