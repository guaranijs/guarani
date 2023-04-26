import { Inject, Injectable } from '@guarani/di';
import { JsonWebKeySet, JsonWebSignatureAlgorithm } from '@guarani/jose';
import { isPlainObject } from '@guarani/primitives';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { URL } from 'url';

import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { DeleteRegistrationContext } from '../context/registration/delete.registration.context';
import { GetRegistrationContext } from '../context/registration/get.registration.context';
import { PostRegistrationContext } from '../context/registration/post.registration.context';
import { PutRegistrationContext } from '../context/registration/put.registration.context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { InsufficientScopeException } from '../exceptions/insufficient-scope.exception';
import { InvalidClientMetadataException } from '../exceptions/invalid-client-metadata.exception';
import { InvalidRedirectUriException } from '../exceptions/invalid-redirect-uri.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { GrantType } from '../grant-types/grant-type.type';
import { ClientAuthorizationHandler } from '../handlers/client-authorization.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpRequest } from '../http/http.request';
import { DeleteRegistrationRequest } from '../requests/registration/delete.registration-request';
import { GetRegistrationRequest } from '../requests/registration/get.registration-request';
import { PostRegistrationRequest } from '../requests/registration/post.registration-request';
import { PutBodyRegistrationRequest } from '../requests/registration/put-body.registration-request';
import { PutQueryRegistrationRequest } from '../requests/registration/put-query.registration-request';
import { ResponseType } from '../response-types/response-type.type';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ApplicationType } from '../types/application-type.type';

/**
 * Implementation of the Registration Request Validator.
 */
@Injectable()
export class RegistrationRequestValidator {
  /**
   * Scopes that grant access to the Dynamic Client Registration Post Request.
   */
  public readonly postRequestScopes: string[] = ['client:manage', 'client:create'];

  /**
   * Scopes that grant access to the Dynamic Client Registration Get Request.
   */
  public readonly getRequestScopes: string[] = ['client:manage', 'client:read'];

  /**
   * Scopes that grant access to the Dynamic Client Registration Delete Request.
   */
  public readonly deleteRequestScopes: string[] = ['client:manage', 'client:delete'];

  /**
   * Scopes that grant access to the Dynamic Client Registration Put Request.
   */
  public readonly putRequestScopes: string[] = ['client:manage', 'client:update'];

  /**
   * Instantiates a new Registration Request Validator.
   *
   * @param scopeHandler Instance of the Scope Handler.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param settings Settings of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    private readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface
  ) {}

  /**
   * Validates the Http Post Registration Request and returns the actors of the Post Registration Context.
   *
   * @param request Http Request.
   * @returns Post Registration Context.
   */
  public async validatePost(request: HttpRequest): Promise<PostRegistrationContext> {
    const accessToken = await this.checkInitialAccessToken(request, this.postRequestScopes);

    const parameters = <PostRegistrationRequest>request.body;

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
      accessToken,
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
   * Validates the Http Get Registration Request and returns the actors of the Get Registration Context.
   *
   * @param request Http Request.
   * @returns Get Registration Context.
   */
  public async validateGet(request: HttpRequest): Promise<GetRegistrationContext> {
    const parameters = <GetRegistrationRequest>request.query;

    const clientId = this.getClientId(parameters);
    const accessToken = await this.authorize(request, clientId, this.getRequestScopes);

    return { parameters, accessToken, client: accessToken.client! };
  }

  /**
   * Validates the Http Delete Registration Request and returns the actors of the Delete Registration Context.
   *
   * @param request Http Request.
   * @returns Delete Registration Context.
   */
  public async validateDelete(request: HttpRequest): Promise<DeleteRegistrationContext> {
    const parameters = <DeleteRegistrationRequest>request.query;

    const clientId = this.getClientId(parameters);
    const accessToken = await this.authorize(request, clientId, this.deleteRequestScopes);

    return { parameters, accessToken, client: accessToken.client! };
  }

  /**
   * Validates the Http Put Registration Request and returns the actors of the Put Registration Context.
   *
   * @param request Http Request.
   * @returns Put Registration Context.
   */
  public async validatePut(request: HttpRequest): Promise<PutRegistrationContext> {
    const queryParameters = <PutQueryRegistrationRequest>request.query;
    const bodyParameters = <PutBodyRegistrationRequest>request.body;

    const queryClientId = this.getClientId(queryParameters);
    const bodyClientId = this.getClientId(bodyParameters);

    const clientId = this.checkPutClientId(queryClientId, bodyClientId);
    const clientSecret = this.getClientSecret(bodyParameters);

    const accessToken = await this.authorize(request, clientId, this.putRequestScopes);

    this.checkClientCredentials(accessToken.client!, clientSecret);

    const redirectUris = this.getRedirectUris(bodyParameters);
    const responseTypes = this.getResponseTypes(bodyParameters);
    const grantTypes = this.getGrantTypes(bodyParameters);

    this.checkResponseTypesAndGrantTypes(responseTypes, grantTypes);

    const applicationType = this.getApplicationType(bodyParameters);

    this.checkApplicationTypeAndRedirectUris(applicationType, redirectUris);

    const clientName = this.getClientName(bodyParameters);
    const scopes = this.getScopes(bodyParameters);
    const contacts = this.getContacts(bodyParameters);
    const logoUri = this.getLogoUri(bodyParameters);
    const clientUri = this.getClientUri(bodyParameters);
    const policyUri = this.getPolicyUri(bodyParameters);
    const tosUri = this.getTosUri(bodyParameters);

    this.checkJwksUriAndJwksAreNotBothProvided(bodyParameters);

    const jwksUri = this.getJwksUri(bodyParameters);
    const jwks = await this.getJwks(bodyParameters);
    // const sectorIdentifierUri = this.getSectorIdentifierUri(parameters);
    // const subjectType = this.getSubjectType(parameters);
    const idTokenSignedResponseAlgorithm = this.getIdTokenSignedResponseAlgorithm(bodyParameters);
    // const idTokenEncryptedResponseKeyWrap = this.getIdTokenEncryptedResponseKeyWrap(parameters);
    // const idTokenEncryptedResponseContentEncryption = this.getIdTokenEncryptedResponseContentEncryption(parameters);
    // const userinfoSignedResponseAlgorithm = this.getUserinfoSignedResponseAlgorithm(parameters);
    // const userinfoEncryptedResponseKeyWrap = this.getUserinfoEncryptedResponseKeyWrap(parameters);
    // const userinfoEncryptedResponseContentEncryption = this.getUserinfoEncryptedResponseContentEncryption(parameters);
    // const requestObjectSigningAlgorithm = this.getRequestObjectSigningAlgorithm(parameters);
    // const requestObjectEncryptionKeyWrap = this.getRequestObjectEncryptionKeyWrap(parameters);
    // const requestObjectEncryptionContentEncryption = this.getRequestObjectEncryptionContentEncryption(parameters);
    const authenticationMethod = this.getAuthenticationMethod(bodyParameters);
    const authenticationSigningAlgorithm = this.getAuthenticationSigningAlgorithm(bodyParameters);

    this.checkAuthenticationMethodAndAuthenticationMethodSignature(bodyParameters);

    const defaultMaxAge = this.getDefaultMaxAge(bodyParameters);
    const requireAuthTime = this.getRequireAuthTime(bodyParameters);
    const defaultAcrValues = this.getDefaultAcrValues(bodyParameters);
    const initiateLoginUri = this.getInitiateLoginUri(bodyParameters);
    // const requestUris = this.getRequestUris(parameters);
    const softwareId = this.getSoftwareId(bodyParameters);
    const softwareVersion = this.getSoftwareVersion(bodyParameters);

    return {
      queryParameters,
      bodyParameters,
      accessToken,
      client: accessToken.client!,
      clientId,
      clientSecret,
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
   * Checks and returns the Identifier of the Client of the Request.
   *
   * @param parameters Parameters of the Client Registration Request.
   * @returns Identifier of the Client of the Request.
   */
  private getClientId<T extends Record<string, any>>(parameters: T): string {
    if (typeof parameters.client_id !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "client_id".' });
    }

    return parameters.client_id;
  }

  /**
   * Checks if the Client Identifiers match and returns the Query Identifier of the Client of the Request.
   *
   * @param queryClientId Identifier of the Client of the Request at the Query Parameters.
   * @param bodyClientId Identifier of the Client of the Request at the Body Parameters.
   * @returns Query Identifier of the Client of the Request.
   */
  private checkPutClientId(queryClientId: string, bodyClientId: string): string {
    const queryClientIdentifier = Buffer.from(queryClientId, 'utf8');
    const bodyClientIdentifier = Buffer.from(bodyClientId, 'utf8');

    if (
      queryClientIdentifier.length !== bodyClientIdentifier.length ||
      !timingSafeEqual(queryClientIdentifier, bodyClientIdentifier)
    ) {
      throw new InvalidClientMetadataException({ description: 'Mismatching Client Identifiers.' });
    }

    return queryClientId;
  }

  /**
   * Checks and returns the Secret of the Client of the Request.
   *
   * @param parameters Parameters of the Put Client Registration Request.
   * @returns Secret of the Client of the Request.
   */
  private getClientSecret(parameters: PutBodyRegistrationRequest): string | undefined {
    if (typeof parameters.client_secret !== 'undefined' && typeof parameters.client_secret !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "client_secret".' });
    }

    return parameters.client_secret;
  }

  /**
   * Checks if the Credentials provided by the Client match it's own data.
   *
   * @param client Client of the Put Registration Request.
   * @param clientSecret Secret of the Client of the Request.
   */
  private checkClientCredentials(client: Client, clientSecret: string | undefined): void {
    if (client.secret == null || typeof clientSecret === 'undefined') {
      return;
    }

    const secret = Buffer.from(client.secret, 'utf8');
    const providedSecret = Buffer.from(clientSecret, 'utf8');

    if (secret.length !== providedSecret.length || !timingSafeEqual(secret, providedSecret)) {
      throw new InvalidClientMetadataException({ description: 'Mismatching Client Secret.' });
    }
  }

  /**
   * Checks and returns the Redirect URIs of the Client.
   *
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Redirect URIs of the Client.
   */
  private getRedirectUris(parameters: PostRegistrationRequest): URL[] {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Response Types requested by the Client.
   */
  private getResponseTypes(parameters: PostRegistrationRequest): ResponseType[] {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Grant Types requested by the Client.
   */
  private getGrantTypes(parameters: PostRegistrationRequest): (GrantType | 'implicit')[] {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Application Type requested by the Client.
   */
  private getApplicationType(parameters: PostRegistrationRequest): ApplicationType {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Client Name provided by the Client.
   */
  private getClientName(parameters: PostRegistrationRequest): string | undefined {
    if (typeof parameters.client_name !== 'undefined' && typeof parameters.client_name !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "client_name".' });
    }

    return parameters.client_name;
  }

  /**
   * Returns the Scopes requested by the Client.
   *
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Scopes requested by the Client.
   */
  private getScopes(parameters: PostRegistrationRequest): string[] {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Contacts requested by the Client.
   */
  private getContacts(parameters: PostRegistrationRequest): string[] | undefined {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Logo URI provided by the Client.
   */
  private getLogoUri(parameters: PostRegistrationRequest): URL | undefined {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Client URI provided by the Client.
   */
  private getClientUri(parameters: PostRegistrationRequest): URL | undefined {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Policy URI provided by the Client.
   */
  private getPolicyUri(parameters: PostRegistrationRequest): URL | undefined {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Terms of Service URI provided by the Client.
   */
  private getTosUri(parameters: PostRegistrationRequest): URL | undefined {
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
   * @param parameters Parameters of the Post Client Registration Request.
   */
  private checkJwksUriAndJwksAreNotBothProvided(parameters: PostRegistrationRequest): void {
    if (typeof parameters.jwks_uri !== 'undefined' && typeof parameters.jwks !== 'undefined') {
      throw new InvalidClientMetadataException({
        description: 'Only one of the parameters "jwks_uri" and "jwks" must be provided.',
      });
    }
  }

  /**
   * Returns the JSON Web Key Set URI provided by the Client.
   *
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns JSON Web Key Set URI provided by the Client.
   */
  private getJwksUri(parameters: PostRegistrationRequest): URL | undefined {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns JSON Web Key Set provided by the Client.
   */
  private async getJwks(parameters: PostRegistrationRequest): Promise<JsonWebKeySet | undefined> {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns ID Token JSON Web Signature Algorithm provided by the Client.
   */
  private getIdTokenSignedResponseAlgorithm(
    parameters: PostRegistrationRequest
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Client Authentication Method provided by the Client.
   */
  private getAuthenticationMethod(parameters: PostRegistrationRequest): ClientAuthentication {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Client Authentication Method JSON Web Signature Algorithm provided by the Client.
   */
  private getAuthenticationSigningAlgorithm(
    parameters: PostRegistrationRequest
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
   * @param parameters Parameters of the Post Client Registration Request.
   */
  private checkAuthenticationMethodAndAuthenticationMethodSignature(parameters: PostRegistrationRequest): void {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Default Max Age provided by the Client.
   */
  private getDefaultMaxAge(parameters: PostRegistrationRequest): number | undefined {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Value for Require Auth Time provided by the Client.
   */
  private getRequireAuthTime(parameters: PostRegistrationRequest): boolean {
    if (typeof parameters.require_auth_time !== 'undefined' && typeof parameters.require_auth_time !== 'boolean') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "require_auth_time".' });
    }

    return parameters.require_auth_time ?? false;
  }

  /**
   * Returns the Default Authentication Context Class References requested by the Client.
   *
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Default Authentication Context Class References requested by the Client.
   */
  private getDefaultAcrValues(parameters: PostRegistrationRequest): string[] | undefined {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Initiate Login URI provided by the Client.
   */
  private getInitiateLoginUri(parameters: PostRegistrationRequest): URL | undefined {
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
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Software Identifier provided by the Client.
   */
  private getSoftwareId(parameters: PostRegistrationRequest): string | undefined {
    if (typeof parameters.software_id !== 'undefined' && typeof parameters.software_id !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "software_id".' });
    }

    return parameters.software_id;
  }

  /**
   * Returns the Software Version provided by the Client.
   *
   * @param parameters Parameters of the Post Client Registration Request.
   * @returns Software Version provided by the Client.
   */
  private getSoftwareVersion(parameters: PostRegistrationRequest): string | undefined {
    if (typeof parameters.software_version !== 'undefined' && typeof parameters.software_version !== 'string') {
      throw new InvalidClientMetadataException({ description: 'Invalid parameter "software_version".' });
    }

    return parameters.software_version;
  }

  /**
   * Retrieves the Initial Access Token from the Request and validates it.
   *
   * @param request Http Request.
   * @param scopes Expected Scopes for the Request.
   * @returns Initial Access Token.
   */
  private async checkInitialAccessToken(request: HttpRequest, scopes: string[]): Promise<AccessToken> {
    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (accessToken.client != null) {
      throw new InvalidTokenException({ description: 'Invalid Credentials.' });
    }

    if (accessToken.scopes.every((scope) => !scopes.includes(scope))) {
      throw new InsufficientScopeException({ description: 'Invalid Credentials.' });
    }

    return accessToken;
  }

  /**
   * Retrieves the Access Token from the Request and validates it.
   *
   * @param request Http Request.
   * @param clientId Identifier of the Client of the Request.
   * @param scopes Expected Scopes for the Request.
   * @returns Access Token based on the handle provided by the Client.
   */
  private async authorize(request: HttpRequest, clientId: string, scopes: string[]): Promise<AccessToken> {
    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (accessToken.client == null) {
      throw new InvalidTokenException({ description: 'Invalid Credentials.' });
    }

    const clientIdentifier = Buffer.from(clientId, 'utf8');
    const accessTokenClientIdentifier = Buffer.from(accessToken.client!.id, 'utf8');

    if (
      clientIdentifier.length !== accessTokenClientIdentifier.length ||
      !timingSafeEqual(clientIdentifier, accessTokenClientIdentifier)
    ) {
      await this.accessTokenService.revoke(accessToken);
      throw new InsufficientScopeException({ description: 'Invalid Credentials.' });
    }

    if (accessToken.scopes.every((scope) => !scopes.includes(scope))) {
      throw new InsufficientScopeException({ description: 'Invalid Credentials.' });
    }

    return accessToken;
  }
}
