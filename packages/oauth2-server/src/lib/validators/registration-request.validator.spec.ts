import { DependencyInjectionContainer } from '@guarani/di';
import { JsonWebSignatureAlgorithm } from '@guarani/jose';
import { removeUndefined } from '@guarani/primitives';

import { Buffer } from 'buffer';
import { URL } from 'url';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { RegistrationContext } from '../context/registration.context';
import { InvalidClientMetadataException } from '../exceptions/invalid-client-metadata.exception';
import { InvalidRedirectUriException } from '../exceptions/invalid-redirect-uri.exception';
import { GrantType } from '../grant-types/grant-type.type';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpRequest } from '../http/http.request';
import { RegistrationRequest } from '../requests/registration-request';
import { ResponseType } from '../response-types/response-type.type';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { RegistrationRequestValidator } from './registration-request.validator';

jest.mock('../handlers/scope.handler');

const invalidRedirectUris: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, () => 1, {}];
const invalidResponseTypes: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}];
const invalidGrantTypes: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}];
const invalidApplicationTypes: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidClientNames: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidScopes: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidContacts: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}];
const invalidLogoUris: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidClientUris: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidPolicyUris: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidTosUris: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidJwksUris: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidJwks: any[] = [null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, Buffer.alloc(1), () => 1, []];
const invalidIdTokenJWSAlgorithms: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidAuthenticationMethods: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidJWTClientAssertionJWSAlgorithms: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidDefaultMaxAges: any[] = [null, true, 1n, 'a', Symbol('a'), Buffer, () => 1, {}, []];
const notPositiveIntegerDefaultMaxAges: any[] = [1.2, -1, -1.2];
const invalidRequireAuthTimes: any[] = [null, 1, 1.2, 1n, 'a', Symbol('a'), Buffer, () => 1, {}, []];
const invalidAcrValues: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}];
const invalidInitiateLoginUris: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidSoftwareIds: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidSoftwareVersions: any[] = [null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

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

const invalidAuthenticationMethodSigningCombinations: [ClientAuthentication, JsonWebSignatureAlgorithm][] = [
  ['private_key_jwt', 'HS256'],
  ['client_secret_jwt', 'RS256'],
];

describe('Registration Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: RegistrationRequestValidator;

  const scopeHandlerMock = jest.mocked(ScopeHandler.prototype, true);

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
    idTokenSignatureAlgorithms: [
      'ES256',
      'ES384',
      'ES512',
      'EdDSA',
      'HS256',
      'HS384',
      'HS512',
      'PS256',
      'PS384',
      'PS512',
      'RS256',
      'RS384',
      'RS512',
    ],
    clientAuthenticationMethods: [
      'client_secret_basic',
      'client_secret_jwt',
      'client_secret_post',
      'none',
      'private_key_jwt',
    ],
    clientAuthenticationSignatureAlgorithms: [
      'ES256',
      'ES384',
      'ES512',
      'EdDSA',
      'HS256',
      'HS384',
      'HS512',
      'PS256',
      'PS384',
      'PS512',
      'RS256',
      'RS384',
      'RS512',
    ],
    acrValues: ['guarani:acr:1fa', 'guarani:acr:2fa'],
  };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(ScopeHandler).toValue(scopeHandlerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(RegistrationRequestValidator).toSelf().asSingleton();

    validator = container.resolve(RegistrationRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validate()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: removeUndefined<RegistrationRequest>({
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
          // sector_identifier_uri: '',
          // subject_type: '',
          id_token_signed_response_alg: 'RS256',
          // id_token_encrypted_response_alg: '',
          // id_token_encrypted_response_enc: '',
          // userinfo_signed_response_alg: '',
          // userinfo_encrypted_response_alg: '',
          // userinfo_encrypted_response_enc: '',
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
          software_id: 'TJ9C-X43C-95V1LK03',
          software_version: 'v1.4.37',
        }),
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/register',
        query: {},
      });
    });

    it.each([...invalidRedirectUris, [...invalidRedirectUris]])(
      'should throw when providing an invalid "redirect_uris" parameter.',
      async (redirectUris) => {
        request.body.redirect_uris = redirectUris;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "redirect_uris".' })
        );
      }
    );

    it('should throw when providing an invalid redirect uri.', async () => {
      request.body.redirect_uris = ['client.example.com/oauth/callback'];

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({ description: 'Invalid Redirect URI "client.example.com/oauth/callback".' })
      );
    });

    it('should throw when providing a redirect uri with a fragment component.', async () => {
      request.body.redirect_uris = ['https://client.example.com/oauth/callback#fragment-component'];

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({
          description:
            'The Redirect URI "https://client.example.com/oauth/callback#fragment-component" MUST NOT have a fragment component.',
        })
      );
    });

    it.each([...invalidResponseTypes, [...invalidResponseTypes]])(
      'should throw when providing an invalid "response_types" parameter.',
      async (responseTypes) => {
        request.body.response_types = responseTypes;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "response_types".' })
        );
      }
    );

    it('should throw when providing an unsupported response type.', async () => {
      request.body.response_types = ['unknown'];

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Unsupported response_type "unknown".' })
      );
    });

    it.each([...invalidGrantTypes, [...invalidGrantTypes]])(
      'should throw when providing an invalid "grant_types" parameter.',
      async (grantTypes) => {
        request.body.grant_types = grantTypes;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "grant_types".' })
        );
      }
    );

    it('should throw when providing an unsupported grant type.', async () => {
      request.body.grant_types = ['unknown'];

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Unsupported grant_type "unknown".' })
      );
    });

    it('should throw when providing the "code" response type and not providing the "authorization_code" grant type.', async () => {
      request.body.response_types = ['code'];
      request.body.grant_types = ['implicit'];

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({
          description: 'The Response Type "code" requires the Grant Type "authorization_code".',
        })
      );
    });

    it.each(implicitResponseTypes)(
      'should throw when providing one of "id_token, id_token token, token" response types and not providing the "implicit" grant type.',
      async (responseTypes) => {
        request.body.response_types = [responseTypes];
        request.body.grant_types = ['authorization_code'];

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({
            description:
              'The Response Types ["id_token", "id_token token", "token"] require the Grant Type "implicit".',
          })
        );
      }
    );

    it.each([...hybridAuthorizationCode, ...hybridImplicit])(
      'should throw when providing one of "code id_token, code id_token token, code token" response types and not providing both "authorization_code" and "implicit" grant types.',
      async (responseType, grantType) => {
        request.body.response_types = [responseType];
        request.body.grant_types = [grantType];

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({
            description:
              'The Response Types ["code id_token", "code id_token token", "code token"] require the Grant Types ["authorization_code", "implicit"].',
          })
        );
      }
    );

    it.each(implicitResponseTypes)(
      'should throw when providing the "authorization_code" grant type and not providing one of "code, code id_token, code id_token token, code token" response types.',
      async (responseType) => {
        request.body.response_types = [responseType];
        request.body.grant_types = ['authorization_code', 'implicit'];

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({
            description:
              'The Grant Type "authorization_code" requires at lease one of the Response Types ["code", "code id_token", "code id_token token", "code token"].',
          })
        );
      }
    );

    it('should throw when providing the "implicit" grant type and not providing one of "code, code id_token, code id_token token, code token, id_token, id_token token, token" response types.', async () => {
      request.body.response_types = ['code'];
      request.body.grant_types = ['authorization_code', 'implicit'];

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({
          description:
            'The Grant Type "implicit" requires at lease one of the Response Types ["code id_token", "code id_token token", "code token", "id_token", "id_token token", "token"].',
        })
      );
    });

    it.each(invalidApplicationTypes)(
      'should throw when providing an invalid "application_type" parameter.',
      async (applicationType) => {
        request.body.application_type = applicationType;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "application_type".' })
        );
      }
    );

    it('should throw when providing an unsupported application type.', async () => {
      request.body.application_type = 'unknown';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Unsupported application_type "unknown".' })
      );
    });

    it('should throw when providing a http(s) redirect uri other than localhost for a native application.', async () => {
      request.body.application_type = 'native';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({
          description:
            'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
        })
      );
    });

    it('should throw when not providing a https redirect uri for a web application.', async () => {
      request.body.redirect_uris = ['http://client.example.com/oauth/callback'];

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({
          description: 'The Redirect URI "http://client.example.com/oauth/callback" does not use the https protocol.',
        })
      );
    });

    it.each(localhostRedirectUris)(
      'should throw when providing a localhost redirect uri for a web application.',
      async (redirectUri) => {
        request.body.redirect_uris = [redirectUri];

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidRedirectUriException({
            description: `The Authorization Server disallows using localhost as a Redirect URI for a "web" application.`,
          })
        );
      }
    );

    it.each(invalidClientNames)(
      'should throw when providing an invalid "client_name" parameter.',
      async (clientName) => {
        request.body.client_name = clientName;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "client_name".' })
        );
      }
    );

    it.each(invalidScopes)('should throw when providing an invalid "scope" parameter.', async (scope) => {
      request.body.scope = scope;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Invalid parameter "scope".' })
      );
    });

    it('should throw when providing an unsupported scope.', async () => {
      request.body.scope = 'foo bar unknown';

      const error = new InvalidClientMetadataException({ description: 'Unsupported scope "unknown".' });

      scopeHandlerMock.checkRequestedScope.mockImplementationOnce(() => {
        throw error;
      });

      await expect(validator.validate(request)).rejects.toThrow(error);
    });

    it.each([...invalidContacts, [...invalidContacts]])(
      'should throw when providing an invalid "contacts" parameter.',
      async (contacts) => {
        request.body.contacts = contacts;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "contacts".' })
        );
      }
    );

    it.each(invalidLogoUris)('should throw when providing an invalid "logo_uri" parameter.', async (logoUri) => {
      request.body.logo_uri = logoUri;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Invalid parameter "logo_uri".' })
      );
    });

    it('should throw when providing an invalid logo uri.', async () => {
      request.body.logo_uri = 'some.cdn.com/client-logo.jpg';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({ description: 'Invalid Logo URI.' })
      );
    });

    it.each(invalidClientUris)('should throw when providing an invalid "client_uri" parameter.', async (clientUri) => {
      request.body.client_uri = clientUri;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Invalid parameter "client_uri".' })
      );
    });

    it('should throw when providing an invalid client uri.', async () => {
      request.body.client_uri = 'client.example.com';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({ description: 'Invalid Client URI.' })
      );
    });

    it.each(invalidPolicyUris)('should throw when providing an invalid "policy_uri" parameter.', async (policyUri) => {
      request.body.policy_uri = policyUri;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Invalid parameter "policy_uri".' })
      );
    });

    it('should throw when providing an invalid policy uri.', async () => {
      request.body.policy_uri = 'client.example.com/policy';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({ description: 'Invalid Policy URI.' })
      );
    });

    it.each(invalidTosUris)('should throw when providing an invalid "tos_uri" parameter.', async (tosUri) => {
      request.body.tos_uri = tosUri;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Invalid parameter "tos_uri".' })
      );
    });

    it('should throw when providing an invalid terms of service uri.', async () => {
      request.body.tos_uri = 'client.example.com/terms-of-service';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({ description: 'Invalid Terms of Service URI.' })
      );
    });

    it('should throw when providing both the "jwks_uri" and "jwks" parameters.', async () => {
      request.body.jwks = {};

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({
          description: 'Only one of the parameters "jwks_uri" and "jwks" must be provided.',
        })
      );
    });

    it.each(invalidJwksUris)('should throw when providing an invalid "jwks_uri" parameter.', async (jwksUri) => {
      request.body.jwks_uri = jwksUri;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Invalid parameter "jwks_uri".' })
      );
    });

    it('should throw when providing an invalid json web key set uri.', async () => {
      request.body.jwks_uri = 'client.example.com/oauth/jwks';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({ description: 'Invalid JSON Web Key Set URI.' })
      );
    });

    it.each(invalidJwks)('should throw when providing an invalid "jwks" parameter.', async (jwks) => {
      delete request.body.jwks_uri;

      request.body.jwks = jwks;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Invalid parameter "jwks".' })
      );
    });

    it('should throw when providing an invalid json web key set.', async () => {
      delete request.body.jwks_uri;

      request.body.jwks = {};

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidRedirectUriException({ description: 'Invalid JSON Web Key Set.' })
      );
    });

    it.each(invalidIdTokenJWSAlgorithms)(
      'should throw when providing an invalid "id_token_signed_response_alg" parameter.',
      async (algorithm) => {
        request.body.id_token_signed_response_alg = algorithm;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "id_token_signed_response_alg".' })
        );
      }
    );

    it('should throw when providing an unsupported id token signed response algorithm.', async () => {
      request.body.id_token_signed_response_alg = 'unknown';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Unsupported id_token_signed_response_alg "unknown".' })
      );
    });

    it.each(invalidAuthenticationMethods)(
      'should throw when providing an invalid "token_endpoint_auth_method" parameter.',
      async (authenticationMethod) => {
        request.body.token_endpoint_auth_method = authenticationMethod;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "token_endpoint_auth_method".' })
        );
      }
    );

    it('should throw when providing an unsupported client authentication method.', async () => {
      request.body.token_endpoint_auth_method = 'unknown';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Unsupported token_endpoint_auth_method "unknown".' })
      );
    });

    it.each(invalidJWTClientAssertionJWSAlgorithms)(
      'should throw when providing an invalid "token_endpoint_auth_signing_alg" parameter.',
      async (algorithm) => {
        request.body.token_endpoint_auth_signing_alg = algorithm;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "token_endpoint_auth_signing_alg".' })
        );
      }
    );

    it('should throw when providing an unsupported jwt client assertion json web signature algorithm.', async () => {
      request.body.token_endpoint_auth_signing_alg = 'unknown';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Unsupported token_endpoint_auth_signing_alg "unknown".' })
      );
    });

    it('should throw when providing a client assertion json web signature algorithm for a client authentication method that does not use it.', async () => {
      request.body.token_endpoint_auth_method = 'client_secret_basic';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({
          description:
            'The Client Authentication Method "client_secret_basic" does not require a Client Authentication Signing Algorithm.',
        })
      );
    });

    it('should throw when not providing a client assertion json web signature algorithm for a client authentication method uses it.', async () => {
      delete request.body.token_endpoint_auth_signing_alg;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({
          description:
            'Missing required parameter "token_endpoint_auth_signing_alg" for Client Authentication Method "private_key_jwt".',
        })
      );
    });

    it('should throw when not providing a "jwks_uri" or "jwks" parameter when requesting a jwt client assertion.', async () => {
      delete request.body.jwks_uri;
      delete request.body.jwks;

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({
          description:
            'One of the parameters "jwks_uri" or "jwks" must be provided for Client Authentication Method "private_key_jwt".',
        })
      );
    });

    it.each(invalidAuthenticationMethodSigningCombinations)(
      'should throw when providing an invalid json web signature algorithm for the provided client authentication method.',
      async (method, algorithm) => {
        request.body.token_endpoint_auth_method = method;
        request.body.token_endpoint_auth_signing_alg = algorithm;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({
            description: `Invalid JSON Web Signature Algorithm "${algorithm}" for Client Authentication Method "${method}".`,
          })
        );
      }
    );

    it.each(invalidDefaultMaxAges)(
      'should throw when providing an invalid "default_max_age" parameter.',
      async (defaultMaxAge) => {
        request.body.default_max_age = defaultMaxAge;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "default_max_age".' })
        );
      }
    );

    it.each(notPositiveIntegerDefaultMaxAges)(
      'should throw when not providing a positive integer default max age.',
      async (defaultMaxAge) => {
        request.body.default_max_age = defaultMaxAge;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'The default max age must be a positive integer.' })
        );
      }
    );

    it.each(invalidRequireAuthTimes)(
      'should throw when providing an invalid "require_auth_time" parameter.',
      async (requireAuthTime) => {
        request.body.require_auth_time = requireAuthTime;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "require_auth_time".' })
        );
      }
    );

    it.each([...invalidAcrValues, [...invalidAcrValues]])(
      'should throw when providing an invalid "default_acr_values" parameter.',
      async (acrValues) => {
        request.body.default_acr_values = acrValues;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "default_acr_values".' })
        );
      }
    );

    it('should throw when providing an unsupported acr value.', async () => {
      request.body.default_acr_values = ['unknown'];

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Unsupported acr_value "unknown".' })
      );
    });

    it.each(invalidInitiateLoginUris)(
      'should throw when providing an invalid "initiate_login_uri" parameter.',
      async (initiateLoginUri) => {
        request.body.initiate_login_uri = initiateLoginUri;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "initiate_login_uri".' })
        );
      }
    );

    it('should throw when providing an invalid initiate login uri.', async () => {
      request.body.initiate_login_uri = 'client.example.com/oauth/initiate';

      await expect(validator.validate(request)).rejects.toThrow(
        new InvalidClientMetadataException({ description: 'Invalid Initiate Login URI.' })
      );
    });

    it.each(invalidSoftwareIds)(
      'should throw when providing an invalid "software_id" parameter.',
      async (softwareId) => {
        request.body.software_id = softwareId;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "software_id".' })
        );
      }
    );

    it.each(invalidSoftwareVersions)(
      'should throw when providing an invalid "software_version" parameter.',
      async (softwareVersion) => {
        request.body.software_version = softwareVersion;

        await expect(validator.validate(request)).rejects.toThrow(
          new InvalidClientMetadataException({ description: 'Invalid parameter "software_version".' })
        );
      }
    );

    it('should return a registration request context.', async () => {
      await expect(validator.validate(request)).resolves.toStrictEqual<RegistrationContext>({
        parameters: <RegistrationRequest>request.body,
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
        jwks: undefined,
        // sectorIdentifierUri: ,
        // subjectType: ,
        idTokenSignedResponseAlgorithm: 'RS256',
        // idTokenEncryptedResponseKeyWrap: ,
        // idTokenEncryptedResponseContentEncryption: ,
        // userinfoSignedResponseAlgorithm: ,
        // userinfoEncryptedResponseKeyWrap: ,
        // userinfoEncryptedResponseContentEncryption: ,
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
        softwareId: 'TJ9C-X43C-95V1LK03',
        softwareVersion: 'v1.4.37',
      });
    });
  });
});
