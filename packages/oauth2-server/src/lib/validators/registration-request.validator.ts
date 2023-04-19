import { Inject, Injectable } from '@guarani/di';
import { JsonWebKeySet, JsonWebSignatureAlgorithm } from '@guarani/jose';
import { isPlainObject } from '@guarani/primitives';

import { URL } from 'url';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { RegistrationContext } from '../context/registration.context';
import { InvalidClientMetadataException } from '../exceptions/invalid-client-metadata.exception';
import { InvalidRedirectUriException } from '../exceptions/invalid-redirect-uri.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { GrantType } from '../grant-types/grant-type.type';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpRequest } from '../http/http.request';
import { RegistrationRequest } from '../requests/registration-request';
import { ResponseType } from '../response-types/response-type.type';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ApplicationType } from '../types/application-type.type';

/**
 * Implementation of the Registration Request Validator.
 */
@Injectable()
export class RegistrationRequestValidator {
  /**
   * Instantiates a new Registration Request Validator.
   *
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) private readonly settings: Settings
  ) {}

  /**
   * Validates the Http Registration Request and returns the actors of the Registration Context.
   *
   * @param request Http Request.
   * @returns Registration Context.
   */
  public async validate(request: HttpRequest<RegistrationRequest>): Promise<RegistrationContext> {
    const { data: parameters } = request;

    const redirectUris = this.getRedirectUris(parameters);
    const responseTypes = this.getResponseTypes(parameters);
    const grantTypes = this.getGrantTypes(parameters);

    this.checkResponseTypesAndGrantTypes(responseTypes, grantTypes);

    const applicationType = this.getApplicationType(parameters);

    this.checkApplicationTypeAndRedirectUris(applicationType, redirectUris);

    const clientName = this.getClientName(parameters);
    const scopes = this.getScopes(parameters);
    const contacts = this.getContacts(parameters);
    const logoUri = this.getLogoUri(parameters);
    const clientUri = this.getClientUri(parameters);
    const policyUri = this.getPolicyUri(parameters);
    const tosUri = this.getTosUri(parameters);

    this.checkJwksUriAndJwksAreNotBothProvided(parameters);

    const jwksUri = this.getJwksUri(parameters);
    const jwks = await this.getJwks(parameters);
    // const sectorIdentifierUri = this.getSectorIdentifierUri(parameters);
    // const subjectType = this.getSubjectType(parameters);
    const idTokenSignedResponseAlgorithm = this.getIdTokenSignedResponseAlgorithm(parameters);
    // const idTokenEncryptedResponseKeyWrap = this.getIdTokenEncryptedResponseKeyWrap(parameters);
    // const idTokenEncryptedResponseContentEncryption = this.getIdTokenEncryptedResponseContentEncryption(parameters);
    // const userinfoSignedResponseAlgorithm = this.getUserinfoSignedResponseAlgorithm(parameters);
    // const userinfoEncryptedResponseKeyWrap = this.getUserinfoEncryptedResponseKeyWrap(parameters);
    // const userinfoEncryptedResponseContentEncryption = this.getUserinfoEncryptedResponseContentEncryption(parameters);
    // const requestObjectSigningAlgorithm = this.getRequestObjectSigningAlgorithm(parameters);
    // const requestObjectEncryptionKeyWrap = this.getRequestObjectEncryptionKeyWrap(parameters);
    // const requestObjectEncryptionContentEncryption = this.getRequestObjectEncryptionContentEncryption(parameters);
    const authenticationMethod = this.getAuthenticationMethod(parameters);
    const authenticationSigningAlgorithm = this.getAuthenticationSigningAlgorithm(parameters);

    this.checkAuthenticationMethodAndAuthenticationMethodSignature(parameters);

    const defaultMaxAge = this.getDefaultMaxAge(parameters);
    const requireAuthTime = this.getRequireAuthTime(parameters);
    const defaultAcrValues = this.getDefaultAcrValues(parameters);
    const initiateLoginUri = this.getInitiateLoginUri(parameters);
    // const requestUris = this.getRequestUris(parameters);
    const softwareId = this.getSoftwareId(parameters);
    const softwareVersion = this.getSoftwareVersion(parameters);

    return {
      parameters,
      redirectUris,
      responseTypes,
      grantTypes,
      applicationType,
      clientName,
      scopes,
      contacts,
      logoUri,
      clientUri,
      policyUri,
      tosUri,
      jwksUri,
      jwks,
      // sectorIdentifierUri,
      // subjectType,
      idTokenSignedResponseAlgorithm,
      // idTokenEncryptedResponseKeyWrap,
      // idTokenEncryptedResponseContentEncryption,
      // userinfoSignedResponseAlgorithm,
      // userinfoEncryptedResponseKeyWrap,
      // userinfoEncryptedResponseContentEncryption,
      // requestObjectSigningAlgorithm,
      // requestObjectEncryptionKeyWrap,
      // requestObjectEncryptionContentEncryption,
      authenticationMethod,
      authenticationSigningAlgorithm,
      defaultMaxAge,
      requireAuthTime,
      defaultAcrValues,
      initiateLoginUri,
      // requestUris,
      softwareId,
      softwareVersion,
    };
  }

  /**
   * Checks and returns the Redirect URIs of the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Redirect URIs of the Client.
   */
  private getRedirectUris(parameters: RegistrationRequest): URL[] {
    if (
      !Array.isArray(parameters.redirect_uris) ||
      parameters.redirect_uris.some((redirectUri) => typeof redirectUri !== 'string')
    ) {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "redirect_uris".' });
    }

    return parameters.redirect_uris.map((redirectUri) => {
      try {
        const url = new URL(redirectUri);

        if (url.hash.length !== 0) {
          throw new InvalidRedirectUriException({
            description: `The Redirect URI "${redirectUri}" MUST NOT have a fragment component.`,
          });
        }

        return url;
      } catch (exc: unknown) {
        if (exc instanceof OAuth2Exception) {
          throw exc;
        }

        const exception = new InvalidRedirectUriException({ description: `Invalid Redirect URI "${redirectUri}".` });
        exception.cause = exc;

        throw exception;
      }
    });
  }

  /**
   * Returns the Response Types requested by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Response Types requested by the Client.
   */
  private getResponseTypes(parameters: RegistrationRequest): ResponseType[] {
    if (
      typeof parameters.response_types !== 'undefined' &&
      (!Array.isArray(parameters.response_types) ||
        parameters.response_types.some((responseType) => typeof responseType !== 'string'))
    ) {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "response_types".' });
    }

    if (typeof parameters.response_types === 'undefined') {
      return ['code'];
    }

    return parameters.response_types.map((responseType) => {
      if (!this.settings.responseTypes.includes(responseType)) {
        throw new InvalidClientMetadataException({ description: `Unsupported response_type "${responseType}".` });
      }

      return responseType;
    });
  }

  /**
   * Returns the Grant Types requested by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Grant Types requested by the Client.
   */
  private getGrantTypes(parameters: RegistrationRequest): (GrantType | 'implicit')[] {
    if (
      typeof parameters.grant_types !== 'undefined' &&
      (!Array.isArray(parameters.grant_types) ||
        parameters.grant_types.some((grantType) => typeof grantType !== 'string'))
    ) {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "grant_types".' });
    }

    if (typeof parameters.grant_types === 'undefined') {
      return ['authorization_code'];
    }

    return parameters.grant_types.map((grantType) => {
      if (grantType !== 'implicit' && !this.settings.grantTypes.includes(grantType)) {
        throw new InvalidClientMetadataException({ description: `Unsupported grant_type "${grantType}".` });
      }

      return grantType;
    });
  }

  /**
   * Checks if the Response Types and Grant Types requested by the Client match each other's requirements.
   *
   * @param responseTypes Response Types requested by the Client.
   * @param grantTypes Grant Types requested by the Client.
   */
  private checkResponseTypesAndGrantTypes(responseTypes: ResponseType[], grantTypes: (GrantType | 'implicit')[]): void {
    const authorizationCodeResponseTypes: ResponseType[] = ['code'];
    const implicitResponseTypes: ResponseType[] = ['id_token', 'id_token token', 'token'];
    const hybridResponseTypes: ResponseType[] = ['code id_token', 'code id_token token', 'code token'];

    const hybridGrantTypes: (GrantType | 'implicit')[] = ['authorization_code', 'implicit'];

    const responseTypesIncludes = (responseType: ResponseType) => responseTypes.includes(responseType);
    const grantTypesIncludes = (grantType: GrantType | 'implicit') => grantTypes.includes(grantType);

    // "code" and "authorization_code"
    if (authorizationCodeResponseTypes.some(responseTypesIncludes) && !grantTypes.includes('authorization_code')) {
      throw new InvalidClientMetadataException({
        description: 'The Response Type "code" requires the Grant Type "authorization_code".',
      });
    }

    // "id_token", "id_token token", "token" and "implicit"
    if (implicitResponseTypes.some(responseTypesIncludes) && !grantTypes.includes('implicit')) {
      const implicitResponseTypesString = implicitResponseTypes.join('", "');

      throw new InvalidClientMetadataException({
        description: `The Response Types ["${implicitResponseTypesString}"] require the Grant Type "implicit".`,
      });
    }

    // "code id_token", "code id_token token", "code token" and "authorization_code", "implicit"
    if (hybridResponseTypes.some(responseTypesIncludes) && !hybridGrantTypes.every(grantTypesIncludes)) {
      const hybridResponseTypesString = hybridResponseTypes.join('", "');
      const hybridGrantTypesString = hybridGrantTypes.join('", "');

      throw new InvalidClientMetadataException({
        description: `The Response Types ["${hybridResponseTypesString}"] require the Grant Types ["${hybridGrantTypesString}"].`,
      });
    }

    // "authorization_code" and "code", "code id_token", "code id_token token", "code token"
    if (
      grantTypes.includes('authorization_code') &&
      ![...authorizationCodeResponseTypes, ...hybridResponseTypes].some(responseTypesIncludes)
    ) {
      const codeResponseTypesString = [...authorizationCodeResponseTypes, ...hybridResponseTypes].join('", "');

      throw new InvalidClientMetadataException({
        description: `The Grant Type "authorization_code" requires at lease one of the Response Types ["${codeResponseTypesString}"].`,
      });
    }

    // "implicit" and "code id_token", "code id_token token", "code token", "id_token", "id_token id_token", "token"
    if (
      grantTypes.includes('implicit') &&
      ![...hybridResponseTypes, ...implicitResponseTypes].some(responseTypesIncludes)
    ) {
      const implicitResponseTypesString = [...hybridResponseTypes, ...implicitResponseTypes].join('", "');

      throw new InvalidClientMetadataException({
        description: `The Grant Type "implicit" requires at lease one of the Response Types ["${implicitResponseTypesString}"].`,
      });
    }
  }

  /**
   * Returns the Application Type requested by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Application Type requested by the Client.
   */
  private getApplicationType(parameters: RegistrationRequest): ApplicationType {
    if (typeof parameters.application_type !== 'undefined' && typeof parameters.application_type !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "application_type".' });
    }

    if (typeof parameters.application_type === 'undefined') {
      return 'web';
    }

    if (parameters.application_type !== 'native' && parameters.application_type !== 'web') {
      throw new InvalidClientMetadataException({
        description: `Unsupported application_type "${parameters.application_type}".`,
      });
    }

    return parameters.application_type;
  }

  /**
   * Checks if the Redirect URIs provided by the Client match the requirements of the requested Application Type.
   *
   * @param applicationType Application Type requested by the Client.
   * @param redirectUris Redirect URIs provided by the Client.
   */
  private checkApplicationTypeAndRedirectUris(applicationType: ApplicationType, redirectUris: URL[]): void {
    redirectUris.forEach((redirectUri) => {
      switch (applicationType) {
        case 'native': {
          if (redirectUri.protocol.includes('http') && redirectUri.hostname !== 'localhost') {
            throw new InvalidRedirectUriException({
              description:
                'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
            });
          }

          break;
        }

        case 'web': {
          if (!redirectUri.protocol.includes('https')) {
            throw new InvalidRedirectUriException({
              description: `The Redirect URI "${redirectUri.href}" does not use the https protocol.`,
            });
          }

          if (redirectUri.hostname === 'localhost' || redirectUri.hostname === '127.0.0.1') {
            throw new InvalidRedirectUriException({
              description:
                'The Authorization Server disallows using localhost as a Redirect URI for a "web" application.',
            });
          }

          break;
        }
      }
    });
  }

  /**
   * Returns the Client Name provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Client Name provided by the Client.
   */
  private getClientName(parameters: RegistrationRequest): string | undefined {
    if (typeof parameters.client_name !== 'undefined' && typeof parameters.client_name !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "client_name".' });
    }

    return parameters.client_name;
  }

  /**
   * Returns the Scopes requested by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Scopes requested by the Client.
   */
  private getScopes(parameters: RegistrationRequest): string[] {
    if (typeof parameters.scope !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "scope".' });
    }

    try {
      this.scopeHandler.checkRequestedScope(parameters.scope);
    } catch (exc: unknown) {
      if (exc instanceof InvalidScopeException) {
        throw new InvalidClientMetadataException({ description: exc.toJSON().error_description });
      }

      throw exc;
    }

    return parameters.scope.split(' ');
  }

  /**
   * Returns the Contacts requested by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Contacts requested by the Client.
   */
  private getContacts(parameters: RegistrationRequest): string[] | undefined {
    if (
      typeof parameters.contacts !== 'undefined' &&
      (!Array.isArray(parameters.contacts) || parameters.contacts.some((contact) => typeof contact !== 'string'))
    ) {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "contacts".' });
    }

    return parameters.contacts;
  }

  /**
   * Returns the Logo URI provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Logo URI provided by the Client.
   */
  private getLogoUri(parameters: RegistrationRequest): URL | undefined {
    if (typeof parameters.logo_uri !== 'undefined' && typeof parameters.logo_uri !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "logo_uri".' });
    }

    if (typeof parameters.logo_uri === 'undefined') {
      return parameters.logo_uri;
    }

    try {
      return new URL(parameters.logo_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException({ description: 'Invalid Logo URI.' });
      exception.cause = exc;
      throw exception;
    }
  }

  /**
   * Returns the Client URI provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Client URI provided by the Client.
   */
  private getClientUri(parameters: RegistrationRequest): URL | undefined {
    if (typeof parameters.client_uri !== 'undefined' && typeof parameters.client_uri !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "client_uri".' });
    }

    if (typeof parameters.client_uri === 'undefined') {
      return parameters.client_uri;
    }

    try {
      return new URL(parameters.client_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException({ description: 'Invalid Client URI.' });
      exception.cause = exc;
      throw exception;
    }
  }

  /**
   * Returns the Policy URI provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Policy URI provided by the Client.
   */
  private getPolicyUri(parameters: RegistrationRequest): URL | undefined {
    if (typeof parameters.policy_uri !== 'undefined' && typeof parameters.policy_uri !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "policy_uri".' });
    }

    if (typeof parameters.policy_uri === 'undefined') {
      return parameters.policy_uri;
    }

    try {
      return new URL(parameters.policy_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException({ description: 'Invalid Policy URI.' });
      exception.cause = exc;
      throw exception;
    }
  }

  /**
   * Returns the Terms of Service URI provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Terms of Service URI provided by the Client.
   */
  private getTosUri(parameters: RegistrationRequest): URL | undefined {
    if (typeof parameters.tos_uri !== 'undefined' && typeof parameters.tos_uri !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "tos_uri".' });
    }

    if (typeof parameters.tos_uri === 'undefined') {
      return parameters.tos_uri;
    }

    try {
      return new URL(parameters.tos_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException({ description: 'Invalid Terms of Service URI.' });
      exception.cause = exc;
      throw exception;
    }
  }

  /**
   * Checks if only one of **jwks_uri** and **jwks** is provided.
   *
   * @param parameters Parameters of the Client Registration Request.
   */
  private checkJwksUriAndJwksAreNotBothProvided(parameters: RegistrationRequest): void {
    if (typeof parameters.jwks_uri !== 'undefined' && typeof parameters.jwks !== 'undefined') {
      throw new InvalidClientMetadataException({
        description: 'Only one of the parameters "jwks_uri" and "jwks" must be provided.',
      });
    }
  }

  /**
   * Returns the JSON Web Key Set URI provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns JSON Web Key Set URI provided by the Client.
   */
  private getJwksUri(parameters: RegistrationRequest): URL | undefined {
    if (typeof parameters.jwks_uri !== 'undefined' && typeof parameters.jwks_uri !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "jwks_uri".' });
    }

    if (typeof parameters.jwks_uri === 'undefined') {
      return parameters.jwks_uri;
    }

    try {
      return new URL(parameters.jwks_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException({ description: 'Invalid JSON Web Key Set URI.' });
      exception.cause = exc;
      throw exception;
    }
  }

  /**
   * Returns the JSON Web Key Set provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns JSON Web Key Set provided by the Client.
   */
  private async getJwks(parameters: RegistrationRequest): Promise<JsonWebKeySet | undefined> {
    if (typeof parameters.jwks !== 'undefined' && !isPlainObject(parameters.jwks)) {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "jwks".' });
    }

    if (typeof parameters.jwks === 'undefined') {
      return parameters.jwks;
    }

    try {
      return await JsonWebKeySet.load(parameters.jwks);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException({ description: 'Invalid JSON Web Key Set.' });
      exception.cause = exc;
      throw exception;
    }
  }

  // private getSectionIdentifierUri(parameters: RegistrationRequest): URL | undefined {}

  // private getSubjectType(parameters: RegistrationRequest): string {}

  /**
   * Returns the ID Token JSON Web Signature Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns ID Token JSON Web Signature Algorithm provided by the Client.
   */
  private getIdTokenSignedResponseAlgorithm(
    parameters: RegistrationRequest
  ): Exclude<JsonWebSignatureAlgorithm, 'none'> {
    if (
      typeof parameters.id_token_signed_response_alg !== 'undefined' &&
      typeof parameters.id_token_signed_response_alg !== 'string'
    ) {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "id_token_signed_response_alg".' });
    }

    if (typeof parameters.id_token_signed_response_alg === 'undefined') {
      return 'RS256';
    }

    if (!this.settings.idTokenSignatureAlgorithms.includes(parameters.id_token_signed_response_alg)) {
      throw new InvalidClientMetadataException({
        description: `Unsupported id_token_signed_response_alg "${parameters.id_token_signed_response_alg}".`,
      });
    }

    return parameters.id_token_signed_response_alg;
  }

  // private getIdTokenEncryptedResponseKeyWrap(parameters: RegistrationRequest): JsonWebEncryptionKeyWrapAlgorithm {}

  // private getIdTokenEncryptedResponseContentEncryption(parameters: RegistrationRequest): JsonWebEncryptionContentEncryptionAlgorithm {}

  // private getUserinfoSignedResponseAlgorithm(parameters: RegistrationRequest): Exclude<JsonWebSignatureAlgorithm, 'none'> {}

  // private getUserinfoEncryptedResponseKeyWrap(parameters: RegistrationRequest): JsonWebEncryptionKeyWrapAlgorithm {}

  // private getUserinfoEncryptedResponseContentEncryption(parameters: RegistrationRequest): JsonWebEncryptionContentEncryptionAlgorithm {}

  // private getRequestObjectSigningAlgorithm(parameters: RegistrationRequest): Exclude<JsonWebSignatureAlgorithm, 'none'> {}

  // private getRequestObjectEncryptionKeyWrap(parameters: RegistrationRequest): JsonWebEncryptionKeyWrapAlgorithm {}

  // private getRequestObjectEncryptionContentEncryption(parameters: RegistrationRequest): JsonWebEncryptionContentEncryptionAlgorithm {}

  /**
   * Returns the Client Authentication Method provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Client Authentication Method provided by the Client.
   */
  private getAuthenticationMethod(parameters: RegistrationRequest): ClientAuthentication {
    if (
      typeof parameters.token_endpoint_auth_method !== 'undefined' &&
      typeof parameters.token_endpoint_auth_method !== 'string'
    ) {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "token_endpoint_auth_method".' });
    }

    if (typeof parameters.token_endpoint_auth_method === 'undefined') {
      return 'client_secret_basic';
    }

    if (!this.settings.clientAuthenticationMethods.includes(parameters.token_endpoint_auth_method)) {
      throw new InvalidClientMetadataException({
        description: `Unsupported token_endpoint_auth_method "${parameters.token_endpoint_auth_method}".`,
      });
    }

    return parameters.token_endpoint_auth_method;
  }

  /**
   * Returns the Client Authentication Method JSON Web Signature Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Client Authentication Method JSON Web Signature Algorithm provided by the Client.
   */
  private getAuthenticationSigningAlgorithm(
    parameters: RegistrationRequest
  ): Exclude<JsonWebSignatureAlgorithm, 'none'> | undefined {
    if (
      typeof parameters.token_endpoint_auth_signing_alg !== 'undefined' &&
      typeof parameters.token_endpoint_auth_signing_alg !== 'string'
    ) {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "token_endpoint_auth_signing_alg".' });
    }

    if (
      typeof parameters.token_endpoint_auth_signing_alg !== 'undefined' &&
      !this.settings.clientAuthenticationSignatureAlgorithms.includes(parameters.token_endpoint_auth_signing_alg)
    ) {
      throw new InvalidClientMetadataException({
        description: `Unsupported token_endpoint_auth_signing_alg "${parameters.token_endpoint_auth_signing_alg}".`,
      });
    }

    return parameters.token_endpoint_auth_signing_alg;
  }

  /**
   * Checks if the JSON Web Signature Algorithm provided by the Client for JWT Client Assertion
   * is valid for the Client Authentication Method provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   */
  private checkAuthenticationMethodAndAuthenticationMethodSignature(parameters: RegistrationRequest): void {
    const {
      token_endpoint_auth_method: authenticationMethod,
      token_endpoint_auth_signing_alg: authenticationSigningAlgorithm,
    } = parameters;

    if (authenticationMethod !== 'client_secret_jwt' && authenticationMethod !== 'private_key_jwt') {
      if (typeof authenticationSigningAlgorithm === 'undefined') {
        return;
      }

      throw new InvalidClientMetadataException({
        description:
          `The Client Authentication Method "${authenticationMethod}" ` +
          'does not require a Client Authentication Signing Algorithm.',
      });
    }

    if (typeof authenticationSigningAlgorithm === 'undefined') {
      throw new InvalidClientMetadataException({
        description:
          'Missing required parameter "token_endpoint_auth_signing_alg" ' +
          `for Client Authentication Method "${authenticationMethod}".`,
      });
    }

    if (typeof parameters.jwks === 'undefined' && typeof parameters.jwks_uri === 'undefined') {
      throw new InvalidClientMetadataException({
        description:
          'One of the parameters "jwks_uri" or "jwks" must be provided ' +
          `for Client Authentication Method "${authenticationMethod}".`,
      });
    }

    let isValidAlgorithmForAuthenticationMethod: boolean;
    const clientSecretJwtAlgorithms: Exclude<JsonWebSignatureAlgorithm, 'none'>[] = ['HS256', 'HS384', 'HS512'];

    switch (authenticationMethod) {
      case 'client_secret_jwt':
        isValidAlgorithmForAuthenticationMethod = clientSecretJwtAlgorithms.includes(authenticationSigningAlgorithm);
        break;

      case 'private_key_jwt':
        isValidAlgorithmForAuthenticationMethod = !clientSecretJwtAlgorithms.includes(authenticationSigningAlgorithm);
        break;
    }

    if (!isValidAlgorithmForAuthenticationMethod) {
      throw new InvalidClientMetadataException({
        description:
          `Invalid JSON Web Signature Algorithm "${authenticationSigningAlgorithm}" ` +
          `for Client Authentication Method "${authenticationMethod}".`,
      });
    }
  }

  /**
   * Returns the Default Max Age provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Default Max Age provided by the Client.
   */
  private getDefaultMaxAge(parameters: RegistrationRequest): number | undefined {
    if (typeof parameters.default_max_age !== 'undefined') {
      if (typeof parameters.default_max_age !== 'number') {
        throw new InvalidClientMetadataException({ description: 'Invalid parameter "default_max_age".' });
      }

      if (!Number.isInteger(parameters.default_max_age) || parameters.default_max_age <= 0) {
        throw new InvalidClientMetadataException({ description: 'The default max age must be a positive integer.' });
      }
    }

    return parameters.default_max_age;
  }

  /**
   * Returns the value for Require Auth Time provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Value for Require Auth Time provided by the Client.
   */
  private getRequireAuthTime(parameters: RegistrationRequest): boolean {
    if (typeof parameters.require_auth_time !== 'undefined' && typeof parameters.require_auth_time !== 'boolean') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "require_auth_time".' });
    }

    return parameters.require_auth_time ?? false;
  }

  /**
   * Returns the Default Authentication Context Class References requested by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Default Authentication Context Class References requested by the Client.
   */
  private getDefaultAcrValues(parameters: RegistrationRequest): string[] | undefined {
    if (
      typeof parameters.default_acr_values !== 'undefined' &&
      (!Array.isArray(parameters.default_acr_values) ||
        parameters.default_acr_values.some((acrValue) => typeof acrValue !== 'string'))
    ) {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "default_acr_values".' });
    }

    return parameters.default_acr_values?.map((acrValue) => {
      if (!this.settings.acrValues.includes(acrValue)) {
        throw new InvalidClientMetadataException({ description: `Unsupported acr_value "${acrValue}".` });
      }

      return acrValue;
    });
  }

  /**
   * Returns the Initiate Login URI provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Initiate Login URI provided by the Client.
   */
  private getInitiateLoginUri(parameters: RegistrationRequest): URL | undefined {
    if (typeof parameters.initiate_login_uri !== 'undefined' && typeof parameters.initiate_login_uri !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "initiate_login_uri".' });
    }

    if (typeof parameters.initiate_login_uri === 'undefined') {
      return parameters.initiate_login_uri;
    }

    try {
      return new URL(parameters.initiate_login_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException({ description: 'Invalid Initiate Login URI.' });
      exception.cause = exc;
      throw exception;
    }
  }

  // private getRequestUris(parameters: RegistrationRequest): URL[] | undefined {}

  /**
   * Returns the Software Identifier provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Software Identifier provided by the Client.
   */
  private getSoftwareId(parameters: RegistrationRequest): string | undefined {
    if (typeof parameters.software_id !== 'undefined' && typeof parameters.software_id !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "software_id".' });
    }

    return parameters.software_id;
  }

  /**
   * Returns the Software Version provided by the Client.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Software Version provided by the Client.
   */
  private getSoftwareVersion(parameters: RegistrationRequest): string | undefined {
    if (typeof parameters.software_version !== 'undefined' && typeof parameters.software_version !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "software_version".' });
    }

    return parameters.software_version;
  }
}
