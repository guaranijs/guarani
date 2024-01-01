import { URL } from 'url';

import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebKeySetParameters,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';
import { removeNullishValues } from '@guarani/primitives';

import { ClientAuthentication } from '../../client-authentication/client-authentication.type';
import { PostRegistrationContext } from '../../context/registration/post.registration-context';
import { PutRegistrationContext } from '../../context/registration/put.registration-context';
import { InvalidClientMetadataException } from '../../exceptions/invalid-client-metadata.exception';
import { InvalidRedirectUriException } from '../../exceptions/invalid-redirect-uri.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { HttpMethod } from '../../http/http-method.type';
import { PostRegistrationRequest } from '../../requests/registration/post.registration-request';
import { PutBodyRegistrationRequest } from '../../requests/registration/put-body.registration-request';
import { ResponseType } from '../../response-types/response-type.type';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { Settings } from '../../settings/settings';
import { ApplicationType } from '../../types/application-type.type';
import { SubjectType } from '../../types/subject-type.type';
import { PostAndPutRegistrationRequestValidator } from './post-and-put.registration-request.validator';

jest.mock('../../handlers/client-authorization.handler');
jest.mock('../../handlers/scope.handler');

const invalidBodies: any[] = [null, true, 1, 1.2, 'a', []];
const invalidRedirectUris: any[] = [undefined, null, true, 1, 1.2, 'a', {}];
const invalidResponseTypes: any[] = [true, 1, 1.2, {}];
const invalidGrantTypes: any[] = [true, 1, 1.2, {}];
const invalidApplicationTypes: any[] = [true, 1, 1.2, {}, []];
const invalidClientNames: any[] = [true, 1, 1.2, {}, []];
const invalidScopes: any[] = [undefined, null, true, 1, 1.2, {}, []];
const invalidContacts: any[] = [true, 1, 1.2, {}];
const invalidLogoUris: any[] = [true, 1, 1.2, {}, []];
const invalidClientUris: any[] = [true, 1, 1.2, {}, []];
const invalidPolicyUris: any[] = [true, 1, 1.2, {}, []];
const invalidTosUris: any[] = [true, 1, 1.2, {}, []];
const invalidJwksUris: any[] = [true, 1, 1.2, {}, []];
const invalidJwks: any[] = [true, 1, 1.2, 'a', []];
const invalidSubjectTypes: any[] = [true, 1, 1.2, {}, []];
const invalidSectorIdentifierUris: any[] = [true, 1, 1.2, {}, []];
const invalidIdTokenJWSAlgorithms: any[] = [true, 1, 1.2, {}, []];
const invalidIdTokenJWEAlgs: any[] = [true, 1, 1.2, {}, []];
const invalidIdTokenJWEEncs: any[] = [true, 1, 1.2, {}, []];
const invalidUserinfoJWSAlgorithms: any[] = [true, 1, 1.2, {}, []];
const invalidUserinfoJWEAlgs: any[] = [true, 1, 1.2, {}, []];
const invalidUserinfoJWEEncs: any[] = [true, 1, 1.2, {}, []];
const invalidAuthorizationJWSAlgorithms: any[] = [true, 1, 1.2, {}, []];
const invalidAuthorizationJWEAlgs: any[] = [true, 1, 1.2, {}, []];
const invalidAuthorizationJWEEncs: any[] = [true, 1, 1.2, {}, []];
const invalidAuthenticationMethods: any[] = [true, 1, 1.2, {}, []];
const invalidJWTClientAssertionJWSAlgorithms: any[] = [true, 1, 1.2, {}, []];
const invalidDefaultMaxAges: any[] = [true, 'a', {}, []];
const notPositiveIntegerDefaultMaxAges: any[] = [1.2, -1, -1.2];
const invalidRequireAuthTimes: any[] = [1, 1.2, 'a', {}, []];
const invalidAcrValues: any[] = [true, 1, 1.2, {}];
const invalidInitiateLoginUris: any[] = [true, 1, 1.2, {}, []];
const invalidPostLogoutRedirectUris: any[] = [true, 1, 1.2, 'a', {}];
const invalidBackChannelLogoutUris: any[] = [true, 1, 1.2, {}, []];
const invalidBackChannelLogoutSessionRequiredValues: any[] = [1, 1.2, 'a', {}, []];
const invalidSoftwareIds: any[] = [true, 1, 1.2, {}, []];
const invalidSoftwareVersions: any[] = [true, 1, 1.2, {}, []];

const implicitResponseTypes: ResponseType[] = ['id_token', 'id_token token', 'token'];
const hybridResponseTypes: ResponseType[] = ['code id_token', 'code id_token token', 'code token'];

const hybridAuthorizationCode = hybridResponseTypes.map<[ResponseType, GrantType | 'implicit']>((responseType) => [
  responseType,
  'authorization_code',
]);

const hybridImplicit = hybridResponseTypes.map<[ResponseType, GrantType | 'implicit']>((responseType) => [
  responseType,
  'implicit',
]);

const localhostRedirectUris = ['https://localhost/oauth/callback', 'https://127.0.0.1/oauth/callback'];
const localhostPostLogoutRedirectUris = [
  'https://localhost/oauth/logout-callback',
  'https://127.0.0.1/oauth/logout-callback',
];
const localhostBackChannelLogoutUris = [
  'https://localhost/oauth/backchannel_callback',
  'https://127.0.0.1/oauth/backchannel_callback',
];

const invalidAuthenticationMethodSigningCombinations: [
  ClientAuthentication,
  Exclude<JsonWebSignatureAlgorithm, 'none'>,
][] = [
  ['private_key_jwt', 'HS256'],
  ['client_secret_jwt', 'RS256'],
];

describe('Post and Put Registration Request Validator', () => {
  let validator: PostAndPutRegistrationRequestValidator;

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
    authorizationSignatureAlgorithms: ['ES256', 'HS256', 'RS256'],
    authorizationKeyWrapAlgorithms: ['A128KW', 'ECDH-ES', 'RSA-OAEP'],
    authorizationContentEncryptionAlgorithms: ['A128CBC-HS256', 'A128GCM'],
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
    enableBackChannelLogout: true,
    includeSessionIdInLogoutToken: true,
  };

  beforeEach(() => {
    validator = Reflect.construct(PostAndPutRegistrationRequestValidator, [
      scopeHandlerMock,
      clientAuthorizationHandlerMock,
      accessTokenServiceMock,
      settings,
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe.each<HttpMethod>(['POST', 'PUT'])('validate()', (method) => {
    const scopes: Record<string, string[][][]> = {
      POST: [[['client:manage']], [['client:create']], [['client:manage', 'client:create']]],
      PUT: [[['client:manage']], [['client:update']], [['client:manage', 'client:update']]],
    };

    let parameters: PostRegistrationRequest | PutBodyRegistrationRequest;

    const requestFactory = (data: Partial<PostRegistrationRequest | PutBodyRegistrationRequest> = {}): HttpRequest => {
      removeNullishValues<PostRegistrationRequest | PutBodyRegistrationRequest>(Object.assign(parameters, data));

      return new HttpRequest({
        body: parameters,
        cookies: {},
        headers: { 'content-type': 'application/json' },
        method,
        url: new URL('https://server.example.com/oauth/register'),
      });
    };

    beforeEach(() => {
      Reflect.set(validator, 'expectedScopes', scopes[method]![2]![0]);

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
        authorization_signed_response_alg: 'RS256',
        authorization_encrypted_response_alg: 'RSA-OAEP',
        authorization_encrypted_response_enc: 'A128GCM',
        token_endpoint_auth_method: 'private_key_jwt',
        token_endpoint_auth_signing_alg: 'RS256',
        default_max_age: 60 * 60 * 24 * 15,
        require_auth_time: true,
        default_acr_values: ['guarani:acr:2fa', 'guarani:acr:1fa'],
        initiate_login_uri: 'https://client.example.com/oauth/initiate',
        // request_uris: ,
        post_logout_redirect_uris: ['https://client.example.com/oauth/logout-callback'],
        backchannel_logout_uri: 'https://client.example.com/oauth/backchannel_callback',
        backchannel_logout_session_required: true,
        software_id: 'TJ9C-X43C-95V1LK03',
        software_version: 'v1.4.37',
      };
    });

    it.each(invalidBodies)('should throw when not providing a plain object to the http request body.', async (body) => {
      const request = new HttpRequest({
        body,
        cookies: {},
        headers: { 'content-type': 'application/json' },
        method,
        url: new URL('https://server.example.com/oauth/register'),
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid Http Request Body.',
      );
    });

    it.each([...invalidRedirectUris, [...invalidRedirectUris]])(
      'should throw when providing an invalid "redirect_uris" parameter.',
      async (redirectUris) => {
        const request = requestFactory({ redirect_uris: redirectUris });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "redirect_uris".',
        );
      },
    );

    it('should throw when providing an invalid redirect uri.', async () => {
      const request = requestFactory({ redirect_uris: ['client.example.com/oauth/callback'] });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRedirectUriException,
        'Invalid Redirect URI "client.example.com/oauth/callback".',
      );
    });

    it('should throw when providing a redirect uri with a fragment component.', async () => {
      const request = requestFactory({
        redirect_uris: ['https://client.example.com/oauth/callback#fragment-component'],
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRedirectUriException,
        'The Redirect URI "https://client.example.com/oauth/callback#fragment-component" MUST NOT have a fragment component.',
      );
    });

    it.each([...invalidResponseTypes, [...invalidResponseTypes]])(
      'should throw when providing an invalid "response_types" parameter.',
      async (responseTypes) => {
        const request = requestFactory({ response_types: responseTypes });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "response_types".',
        );
      },
    );

    it('should throw when providing an unsupported response type.', async () => {
      const request = requestFactory({ response_types: ['unknown' as ResponseType] });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported response_type "unknown".',
      );
    });

    it.each([...invalidGrantTypes, [...invalidGrantTypes]])(
      'should throw when providing an invalid "grant_types" parameter.',
      async (grantTypes) => {
        const request = requestFactory({ grant_types: grantTypes });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "grant_types".',
        );
      },
    );

    it('should throw when providing an unsupported grant type.', async () => {
      const request = requestFactory({ grant_types: ['unknown' as GrantType] });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported grant_type "unknown".',
      );
    });

    it('should throw when providing the "code" response type and not providing the "authorization_code" grant type.', async () => {
      const request = requestFactory({ response_types: ['code'], grant_types: ['implicit'] });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Response Type "code" requires the Grant Type "authorization_code".',
      );
    });

    it.each(implicitResponseTypes)(
      'should throw when providing one of "id_token, id_token token, token" response types and not providing the "implicit" grant type.',
      async (responseTypes) => {
        const request = requestFactory({ response_types: [responseTypes], grant_types: ['authorization_code'] });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'The Response Types ["id_token", "id_token token", "token"] require the Grant Type "implicit".',
        );
      },
    );

    it.each([...hybridAuthorizationCode, ...hybridImplicit])(
      'should throw when providing one of "code id_token, code id_token token, code token" response types and not providing both "authorization_code" and "implicit" grant types.',
      async (responseType, grantType) => {
        const request = requestFactory({ response_types: [responseType], grant_types: [grantType] });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'The Response Types ["code id_token", "code id_token token", "code token"] require the Grant Types ["authorization_code", "implicit"].',
        );
      },
    );

    it.each(implicitResponseTypes)(
      'should throw when providing the "authorization_code" grant type and not providing one of "code, code id_token, code id_token token, code token" response types.',
      async (responseType) => {
        const request = requestFactory({
          response_types: [responseType],
          grant_types: ['authorization_code', 'implicit'],
        });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'The Grant Type "authorization_code" requires at lease one of the Response Types ["code", "code id_token", "code id_token token", "code token"].',
        );
      },
    );

    it('should throw when providing the "implicit" grant type and not providing one of "code, code id_token, code id_token token, code token, id_token, id_token token, token" response types.', async () => {
      const request = requestFactory({ response_types: ['code'], grant_types: ['authorization_code', 'implicit'] });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Grant Type "implicit" requires at lease one of the Response Types ["code id_token", "code id_token token", "code token", "id_token", "id_token token", "token"].',
      );
    });

    it.each(invalidApplicationTypes)(
      'should throw when providing an invalid "application_type" parameter.',
      async (applicationType) => {
        const request = requestFactory({ application_type: applicationType });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "application_type".',
        );
      },
    );

    it('should throw when providing an unsupported application type.', async () => {
      const request = requestFactory({ application_type: 'unknown' as ApplicationType });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported application_type "unknown".',
      );
    });

    it('should throw when providing a http(s) redirect uri other than localhost for a native application.', async () => {
      const request = requestFactory({ application_type: 'native' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRedirectUriException,
        'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
      );
    });

    it('should throw when not providing a https redirect uri for a web application.', async () => {
      const request = requestFactory({ redirect_uris: ['http://client.example.com/oauth/callback'] });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidRedirectUriException,
        'The Redirect URI "http://client.example.com/oauth/callback" does not use the https protocol.',
      );
    });

    it.each(localhostRedirectUris)(
      'should throw when providing a localhost redirect uri for a web application.',
      async (redirectUri) => {
        const request = requestFactory({ redirect_uris: [redirectUri] });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidRedirectUriException,
          'The Authorization Server disallows using localhost as a Redirect URI for a "web" application.',
        );
      },
    );

    it.each(invalidClientNames)(
      'should throw when providing an invalid "client_name" parameter.',
      async (clientName) => {
        const request = requestFactory({ client_name: clientName });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "client_name".',
        );
      },
    );

    it.each(invalidScopes)('should throw when providing an invalid "scope" parameter.', async (scope) => {
      const request = requestFactory({ scope });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid parameter "scope".',
      );
    });

    it('should throw when providing an unsupported scope.', async () => {
      const request = requestFactory({ scope: 'foo bar unknown' });

      const error = new InvalidClientMetadataException('Unsupported scope "unknown".');

      scopeHandlerMock.checkRequestedScope.mockImplementationOnce(() => {
        throw error;
      });

      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it.each([...invalidContacts, [...invalidContacts]])(
      'should throw when providing an invalid "contacts" parameter.',
      async (contacts) => {
        const request = requestFactory({ contacts });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "contacts".',
        );
      },
    );

    it.each(invalidLogoUris)('should throw when providing an invalid "logo_uri" parameter.', async (logoUri) => {
      const request = requestFactory({ logo_uri: logoUri });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid parameter "logo_uri".',
      );
    });

    it('should throw when providing an invalid logo uri.', async () => {
      const request = requestFactory({ logo_uri: 'some.cdn.com/client-logo.jpg' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid Logo URI.',
      );
    });

    it.each(invalidClientUris)('should throw when providing an invalid "client_uri" parameter.', async (clientUri) => {
      const request = requestFactory({ client_uri: clientUri });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid parameter "client_uri".',
      );
    });

    it('should throw when providing an invalid client uri.', async () => {
      const request = requestFactory({ client_uri: 'client.example.com' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid Client URI.',
      );
    });

    it.each(invalidPolicyUris)('should throw when providing an invalid "policy_uri" parameter.', async (policyUri) => {
      const request = requestFactory({ policy_uri: policyUri });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid parameter "policy_uri".',
      );
    });

    it('should throw when providing an invalid policy uri.', async () => {
      const request = requestFactory({ policy_uri: 'client.example.com/policy' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid Policy URI.',
      );
    });

    it.each(invalidTosUris)('should throw when providing an invalid "tos_uri" parameter.', async (tosUri) => {
      const request = requestFactory({ tos_uri: tosUri });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid parameter "tos_uri".',
      );
    });

    it('should throw when providing an invalid terms of service uri.', async () => {
      const request = requestFactory({ tos_uri: 'client.example.com/terms-of-service' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid Terms of Service URI.',
      );
    });

    it('should throw when providing both the "jwks_uri" and "jwks" parameters.', async () => {
      const request = requestFactory({ jwks: {} as JsonWebKeySetParameters });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Only one of the parameters "jwks_uri" and "jwks" must be provided.',
      );
    });

    it.each(invalidJwksUris)('should throw when providing an invalid "jwks_uri" parameter.', async (jwksUri) => {
      const request = requestFactory({ jwks_uri: jwksUri });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid parameter "jwks_uri".',
      );
    });

    it('should throw when providing an invalid json web key set uri.', async () => {
      const request = requestFactory({ jwks_uri: 'client.example.com/oauth/jwks' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid JSON Web Key Set URI.',
      );
    });

    it.each(invalidJwks)('should throw when providing an invalid "jwks" parameter.', async (jwks) => {
      const request = requestFactory({ jwks, jwks_uri: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid parameter "jwks".',
      );
    });

    it('should throw when providing an invalid json web key set.', async () => {
      const request = requestFactory({ jwks: {} as JsonWebKeySetParameters, jwks_uri: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid JSON Web Key Set.',
      );
    });

    it('should throw when the subject type is "pairwise" and no sector identifier uri is provided.', async () => {
      const request = requestFactory({ subject_type: 'pairwise', sector_identifier_uri: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Subject Type "pairwise" requires a Sector Identifier URI.',
      );
    });

    it.each(invalidSubjectTypes)(
      'should throw when providing an invalid "subject_type" parameter.',
      async (subjectType) => {
        const request = requestFactory({ subject_type: subjectType });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "subject_type".',
        );
      },
    );

    it('should throw when providing an unsupported subject type.', async () => {
      const request = requestFactory({ subject_type: 'unknown' as SubjectType });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported subject_type "unknown".',
      );
    });

    it.each(invalidSectorIdentifierUris)(
      'should throw when providing an invalid "sector_identifier_uri" parameter.',
      async (sectorIdentifierUri) => {
        const request = requestFactory({ sector_identifier_uri: sectorIdentifierUri });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "sector_identifier_uri".',
        );
      },
    );

    it('should throw when providing an invalid sector identifier uri.', async () => {
      const request = requestFactory({ sector_identifier_uri: 'client.example.com/redirect_uris.json' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid Sector Identifier URI.',
      );
    });

    it('should throw when the sector identifier uri does not use the https protocol.', async () => {
      const request = requestFactory({ sector_identifier_uri: 'http://client.example.com/redirect_uris.json' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Sector Identifier URI does not use the https protocol.',
      );
    });

    it.each(invalidIdTokenJWSAlgorithms)(
      'should throw when providing an invalid "id_token_signed_response_alg" parameter.',
      async (algorithm) => {
        const request = requestFactory({ id_token_signed_response_alg: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "id_token_signed_response_alg".',
        );
      },
    );

    it('should throw when providing an unsupported id token signed response algorithm.', async () => {
      const request = requestFactory({
        id_token_signed_response_alg: 'unknown' as Exclude<JsonWebSignatureAlgorithm, 'none'>,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported id_token_signed_response_alg "unknown".',
      );
    });

    it.each(invalidIdTokenJWEAlgs)(
      'should throw when providing an invalid "id_token_encrypted_response_alg" parameter.',
      async (algorithm) => {
        const request = requestFactory({ id_token_encrypted_response_alg: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "id_token_encrypted_response_alg".',
        );
      },
    );

    it('should throw when providing an unsupported id token encrypted response key wrap algorithm.', async () => {
      const request = requestFactory({
        id_token_encrypted_response_alg: 'unknown' as JsonWebEncryptionKeyWrapAlgorithm,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported id_token_encrypted_response_alg "unknown".',
      );
    });

    it.each(invalidIdTokenJWEEncs)(
      'should throw when providing an invalid "id_token_encrypted_response_enc" parameter.',
      async (algorithm) => {
        const request = requestFactory({ id_token_encrypted_response_enc: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "id_token_encrypted_response_enc".',
        );
      },
    );

    it('should throw when not providing the parameter "id_token_encrypted_response_alg" together with the parameter "id_token_encrypted_response_enc".', async () => {
      const request = requestFactory({ id_token_encrypted_response_alg: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The parameter "id_token_encrypted_response_enc" must be presented together ' +
          'with the parameter "id_token_encrypted_response_alg".',
      );
    });

    it('should throw when providing an unsupported id token encrypted response content encryption algorithm.', async () => {
      const request = requestFactory({
        id_token_encrypted_response_enc: 'unknown' as JsonWebEncryptionContentEncryptionAlgorithm,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported id_token_encrypted_response_enc "unknown".',
      );
    });

    it.each(invalidUserinfoJWSAlgorithms)(
      'should throw when providing an invalid "userinfo_signed_response_alg" parameter.',
      async (algorithm) => {
        const request = requestFactory({ userinfo_signed_response_alg: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "userinfo_signed_response_alg".',
        );
      },
    );

    it('should throw when providing an unsupported userinfo signed response algorithm.', async () => {
      const request = requestFactory({
        userinfo_signed_response_alg: 'unknown' as Exclude<JsonWebSignatureAlgorithm, 'none'>,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported userinfo_signed_response_alg "unknown".',
      );
    });

    it.each(invalidUserinfoJWEAlgs)(
      'should throw when providing an invalid "userinfo_encrypted_response_alg" parameter.',
      async (algorithm) => {
        const request = requestFactory({ userinfo_encrypted_response_alg: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "userinfo_encrypted_response_alg".',
        );
      },
    );

    it('should throw when providing an unsupported userinfo encrypted response key wrap algorithm.', async () => {
      const request = requestFactory({
        userinfo_encrypted_response_alg: 'unknown' as JsonWebEncryptionKeyWrapAlgorithm,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported userinfo_encrypted_response_alg "unknown".',
      );
    });

    it.each(invalidUserinfoJWEEncs)(
      'should throw when providing an invalid "userinfo_encrypted_response_enc" parameter.',
      async (algorithm) => {
        const request = requestFactory({ userinfo_encrypted_response_enc: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "userinfo_encrypted_response_enc".',
        );
      },
    );

    it('should throw when not providing the parameter "userinfo_signed_response_alg" together with the parameter "userinfo_encrypted_response_alg".', async () => {
      const request = requestFactory({ userinfo_signed_response_alg: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The parameter "userinfo_encrypted_response_alg" must be presented together ' +
          'with the parameter "userinfo_signed_response_alg".',
      );
    });

    it('should throw when not providing the parameter "userinfo_encrypted_response_alg" together with the parameter "userinfo_encrypted_response_enc".', async () => {
      const request = requestFactory({ userinfo_encrypted_response_alg: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The parameter "userinfo_encrypted_response_enc" must be presented together ' +
          'with the parameter "userinfo_encrypted_response_alg".',
      );
    });

    it('should throw when providing an unsupported userinfo encrypted response content encryption algorithm.', async () => {
      const request = requestFactory({
        userinfo_encrypted_response_enc: 'unknown' as JsonWebEncryptionContentEncryptionAlgorithm,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported userinfo_encrypted_response_enc "unknown".',
      );
    });

    it.each(invalidAuthorizationJWSAlgorithms)(
      'should throw when providing an invalid "authorization_signed_response_alg" parameter.',
      async (algorithm) => {
        const request = requestFactory({ authorization_signed_response_alg: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "authorization_signed_response_alg".',
        );
      },
    );

    it('should throw when providing an unsupported authorization signed response algorithm.', async () => {
      const request = requestFactory({
        authorization_signed_response_alg: 'unknown' as Exclude<JsonWebSignatureAlgorithm, 'none'>,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported authorization_signed_response_alg "unknown".',
      );
    });

    it.each(invalidAuthorizationJWEAlgs)(
      'should throw when providing an invalid "authorization_encrypted_response_alg" parameter.',
      async (algorithm) => {
        const request = requestFactory({ authorization_encrypted_response_alg: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "authorization_encrypted_response_alg".',
        );
      },
    );

    it('should throw when providing an unsupported authorization encrypted response key wrap algorithm.', async () => {
      const request = requestFactory({
        authorization_encrypted_response_alg: 'unknown' as JsonWebEncryptionKeyWrapAlgorithm,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported authorization_encrypted_response_alg "unknown".',
      );
    });

    it.each(invalidAuthorizationJWEEncs)(
      'should throw when providing an invalid "authorization_encrypted_response_enc" parameter.',
      async (algorithm) => {
        const request = requestFactory({ authorization_encrypted_response_enc: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "authorization_encrypted_response_enc".',
        );
      },
    );

    it('should throw when not providing the parameter "authorization_signed_response_alg" together with the parameter "authorization_encrypted_response_alg".', async () => {
      const request = requestFactory({ authorization_signed_response_alg: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The parameter "authorization_encrypted_response_alg" must be presented together ' +
          'with the parameter "authorization_signed_response_alg".',
      );
    });

    it('should throw when not providing the parameter "authorization_encrypted_response_alg" together with the parameter "authorization_encrypted_response_enc".', async () => {
      const request = requestFactory({ authorization_encrypted_response_alg: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The parameter "authorization_encrypted_response_enc" must be presented together ' +
          'with the parameter "authorization_encrypted_response_alg".',
      );
    });

    it('should throw when providing an unsupported authorization encrypted response content encryption algorithm.', async () => {
      const request = requestFactory({
        authorization_encrypted_response_enc: 'unknown' as JsonWebEncryptionContentEncryptionAlgorithm,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported authorization_encrypted_response_enc "unknown".',
      );
    });

    it.each(invalidAuthenticationMethods)(
      'should throw when providing an invalid "token_endpoint_auth_method" parameter.',
      async (authenticationMethod) => {
        const request = requestFactory({ token_endpoint_auth_method: authenticationMethod });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "token_endpoint_auth_method".',
        );
      },
    );

    it('should throw when providing an unsupported client authentication method.', async () => {
      const request = requestFactory({ token_endpoint_auth_method: 'unknown' as ClientAuthentication });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported token_endpoint_auth_method "unknown".',
      );
    });

    it.each(invalidJWTClientAssertionJWSAlgorithms)(
      'should throw when providing an invalid "token_endpoint_auth_signing_alg" parameter.',
      async (algorithm) => {
        const request = requestFactory({ token_endpoint_auth_signing_alg: algorithm });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "token_endpoint_auth_signing_alg".',
        );
      },
    );

    it('should throw when providing an unsupported jwt client assertion json web signature algorithm.', async () => {
      const request = requestFactory({
        token_endpoint_auth_signing_alg: 'unknown' as Exclude<JsonWebSignatureAlgorithm, 'none'>,
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported token_endpoint_auth_signing_alg "unknown".',
      );
    });

    it('should throw when providing a client assertion json web signature algorithm for a client authentication method that does not use it.', async () => {
      const request = requestFactory({ token_endpoint_auth_method: 'client_secret_basic' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Client Authentication Method "client_secret_basic" does not require a Client Authentication Signing Algorithm.',
      );
    });

    it('should throw when not providing a client assertion json web signature algorithm for a client authentication method uses it.', async () => {
      const request = requestFactory({ token_endpoint_auth_signing_alg: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Missing required parameter "token_endpoint_auth_signing_alg" for Client Authentication Method "private_key_jwt".',
      );
    });

    it('should throw when not providing a "jwks_uri" or "jwks" parameter when requesting a jwt client assertion.', async () => {
      const request = requestFactory({ jwks: undefined, jwks_uri: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'One of the parameters "jwks_uri" or "jwks" must be provided for Client Authentication Method "private_key_jwt".',
      );
    });

    it.each(invalidAuthenticationMethodSigningCombinations)(
      'should throw when providing an invalid json web signature algorithm for the provided client authentication method.',
      async (method, algorithm) => {
        const request = requestFactory({
          token_endpoint_auth_method: method,
          token_endpoint_auth_signing_alg: algorithm,
        });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          `Invalid JSON Web Signature Algorithm "${algorithm}" for Client Authentication Method "${method}".`,
        );
      },
    );

    it.each(invalidDefaultMaxAges)(
      'should throw when providing an invalid "default_max_age" parameter.',
      async (defaultMaxAge) => {
        const request = requestFactory({ default_max_age: defaultMaxAge });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "default_max_age".',
        );
      },
    );

    it.each(notPositiveIntegerDefaultMaxAges)(
      'should throw when not providing a positive integer default max age.',
      async (defaultMaxAge) => {
        const request = requestFactory({ default_max_age: defaultMaxAge });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'The default max age must be a positive integer.',
        );
      },
    );

    it.each(invalidRequireAuthTimes)(
      'should throw when providing an invalid "require_auth_time" parameter.',
      async (requireAuthTime) => {
        const request = requestFactory({ require_auth_time: requireAuthTime });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "require_auth_time".',
        );
      },
    );

    it.each([...invalidAcrValues, [...invalidAcrValues]])(
      'should throw when providing an invalid "default_acr_values" parameter.',
      async (acrValues) => {
        const request = requestFactory({ default_acr_values: acrValues });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "default_acr_values".',
        );
      },
    );

    it('should throw when providing an unsupported acr value.', async () => {
      const request = requestFactory({ default_acr_values: ['unknown'] });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Unsupported acr_value "unknown".',
      );
    });

    it.each(invalidInitiateLoginUris)(
      'should throw when providing an invalid "initiate_login_uri" parameter.',
      async (initiateLoginUri) => {
        const request = requestFactory({ initiate_login_uri: initiateLoginUri });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "initiate_login_uri".',
        );
      },
    );

    it('should throw when providing an invalid initiate login uri.', async () => {
      const request = requestFactory({ initiate_login_uri: 'client.example.com/oauth/initiate' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid Initiate Login URI.',
      );
    });

    it.each([...invalidPostLogoutRedirectUris, [...invalidPostLogoutRedirectUris]])(
      'should throw when providing an invalid "post_logout_redirect_uris" parameter.',
      async (postLogoutRedirectUris) => {
        const request = requestFactory({ post_logout_redirect_uris: postLogoutRedirectUris });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "post_logout_redirect_uris".',
        );
      },
    );

    it('should throw when providing an invalid post logout redirect uri.', async () => {
      const request = requestFactory({ post_logout_redirect_uris: ['client.example.com/oauth/logout-callback'] });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid Post Logout Redirect URI "client.example.com/oauth/logout-callback".',
      );
    });

    it('should throw when providing a post logout redirect uri with a fragment component.', async () => {
      const request = requestFactory({
        post_logout_redirect_uris: ['https://client.example.com/oauth/logout-callback#fragment-component'],
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Post Logout Redirect URI "https://client.example.com/oauth/logout-callback#fragment-component" ' +
          'MUST NOT have a fragment component.',
      );
    });

    it('should throw when providing a http(s) post logout redirect uri other than localhost for a native application.', async () => {
      const request = requestFactory({
        redirect_uris: ['http://localhost/oauth/callback'],
        application_type: 'native',
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
      );
    });

    it('should throw when not providing a https post logout redirect uri for a web application.', async () => {
      const request = requestFactory({
        post_logout_redirect_uris: ['http://client.example.com/oauth/logout-callback'],
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Post Logout Redirect URI "http://client.example.com/oauth/logout-callback" does not use the https protocol.',
      );
    });

    it.each(localhostPostLogoutRedirectUris)(
      'should throw when providing a localhost post logout redirect uri for a web application.',
      async (postLogoutRedirectUri) => {
        const request = requestFactory({ post_logout_redirect_uris: [postLogoutRedirectUri] });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'The Authorization Server disallows using localhost as a Post Logout Redirect URI for a "web" application.',
        );
      },
    );

    it('should throw when not providing the parameter "backchannel_logout_uri" together with the parameter "backchannel_logout_session_required".', async () => {
      const request = requestFactory({ backchannel_logout_uri: undefined });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The parameter "backchannel_logout_session_required" must be presented together ' +
          'with the parameter "backchannel_logout_uri".',
      );
    });

    it.each(invalidBackChannelLogoutUris)(
      'should throw when providing an invalid "backchannel_logout_uri" parameter.',
      async (backChannelLogoutUri) => {
        const request = requestFactory({ backchannel_logout_uri: backChannelLogoutUri });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "backchannel_logout_uri".',
        );
      },
    );

    it('should throw when the authorization server does not support back-channel logout.', async () => {
      Reflect.set(settings, 'enableBackChannelLogout', false);

      const request = requestFactory();

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Authorization Server does not support Back-Channel Logout.',
      );

      Reflect.set(settings, 'enableBackChannelLogout', true);
    });

    it('should throw when providing an invalid back-channel logout uri.', async () => {
      const request = requestFactory({ backchannel_logout_uri: 'client.example.com/oauth/backchannel_callback' });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'Invalid Back-Channel Logout URI "client.example.com/oauth/backchannel_callback".',
      );
    });

    it('should throw when providing a back-channel logout uri with a fragment component.', async () => {
      const request = requestFactory({
        backchannel_logout_uri: 'https://client.example.com/oauth/backchannel_callback#fragment-component',
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Back-Channel Logout URI "https://client.example.com/oauth/backchannel_callback#fragment-component" ' +
          'MUST NOT have a fragment component.',
      );
    });

    it.each(invalidBackChannelLogoutSessionRequiredValues)(
      'should throw when providing an invalid "backchannel_logout_session_required" parameter.',
      async (backChannelLogoutSessionRequired) => {
        const request = requestFactory({ backchannel_logout_session_required: backChannelLogoutSessionRequired });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "backchannel_logout_session_required".',
        );
      },
    );

    it('should throw when the authorization server does not support passing the "sid" claim in the logout token.', async () => {
      Reflect.set(settings, 'includeSessionIdInLogoutToken', false);

      const request = requestFactory();

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Authorization Server does not support passing the claim "sid" in the Logout Token.',
      );

      Reflect.set(settings, 'includeSessionIdInLogoutToken', true);
    });

    it('should throw when providing a http(s) redirect uri other than localhost for a native application.', async () => {
      const request = requestFactory({
        redirect_uris: ['http://localhost/oauth/callback'],
        application_type: 'native',
        post_logout_redirect_uris: ['http://localhost/oauth/logout-callback'],
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
      );
    });

    it('should throw when not providing a https redirect uri for a web application.', async () => {
      const request = requestFactory({
        backchannel_logout_uri: 'http://client.example.com/oauth/backchannel_callback',
      });

      await expect(validator.validate(request)).rejects.toThrowWithMessage(
        InvalidClientMetadataException,
        'The Back-Channel Logout URI "http://client.example.com/oauth/backchannel_callback" does not use the https protocol.',
      );
    });

    it.each(localhostBackChannelLogoutUris)(
      'should throw when providing a localhost redirect uri for a web application.',
      async (redirectUri) => {
        const request = requestFactory({ backchannel_logout_uri: redirectUri });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'The Authorization Server disallows using localhost as a Back-Channel Logout URI for a "web" application.',
        );
      },
    );

    it.each(invalidSoftwareIds)(
      'should throw when providing an invalid "software_id" parameter.',
      async (softwareId) => {
        const request = requestFactory({ software_id: softwareId });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "software_id".',
        );
      },
    );

    it.each(invalidSoftwareVersions)(
      'should throw when providing an invalid "software_version" parameter.',
      async (softwareVersion) => {
        const request = requestFactory({ software_version: softwareVersion });

        await expect(validator.validate(request)).rejects.toThrowWithMessage(
          InvalidClientMetadataException,
          'Invalid parameter "software_version".',
        );
      },
    );

    it('should return a post registration request context.', async () => {
      const request = requestFactory({});

      await expect(validator.validate(request)).resolves.toStrictEqual<
        PostRegistrationContext | PutRegistrationContext
      >(<PostRegistrationContext | PutRegistrationContext>{
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
        authorizationSignedResponseAlgorithm: 'RS256',
        authorizationEncryptedResponseKeyWrap: 'RSA-OAEP',
        authorizationEncryptedResponseContentEncryption: 'A128GCM',
        authenticationMethod: 'private_key_jwt',
        authenticationSigningAlgorithm: 'RS256',
        defaultMaxAge: 60 * 60 * 24 * 15,
        requireAuthTime: true,
        defaultAcrValues: ['guarani:acr:2fa', 'guarani:acr:1fa'],
        initiateLoginUri: new URL('https://client.example.com/oauth/initiate'),
        // requestUris: ,
        postLogoutRedirectUris: [new URL('https://client.example.com/oauth/logout-callback')],
        backChannelLogoutUri: new URL('https://client.example.com/oauth/backchannel_callback'),
        backChannelLogoutSessionRequired: true,
        softwareId: 'TJ9C-X43C-95V1LK03',
        softwareVersion: 'v1.4.37',
      });
    });
  });
});
