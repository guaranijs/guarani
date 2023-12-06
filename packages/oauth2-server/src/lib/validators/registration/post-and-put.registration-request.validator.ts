import { URL } from 'url';

import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebKeySet,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';
import { isPlainObject } from '@guarani/primitives';
import { Nullable } from '@guarani/types';

import { ClientAuthentication } from '../../client-authentication/client-authentication.type';
import { PostRegistrationContext } from '../../context/registration/post.registration-context';
import { PutRegistrationContext } from '../../context/registration/put.registration-context';
import { InvalidClientMetadataException } from '../../exceptions/invalid-client-metadata.exception';
import { InvalidRedirectUriException } from '../../exceptions/invalid-redirect-uri.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../../exceptions/invalid-scope.exception';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { PostRegistrationRequest } from '../../requests/registration/post.registration-request';
import { PutBodyRegistrationRequest } from '../../requests/registration/put-body.registration-request';
import { ResponseType } from '../../response-types/response-type.type';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { Settings } from '../../settings/settings';
import { ApplicationType } from '../../types/application-type.type';
import { SubjectType } from '../../types/subject-type.type';
import { RegistrationRequestValidator } from './registration-request.validator';

/**
 * Abstract Base Class of the Post and Put Registration Request Validators.
 */
export abstract class PostAndPutRegistrationRequestValidator<
  TContext extends PostRegistrationContext | PutRegistrationContext = PostRegistrationContext | PutRegistrationContext,
> extends RegistrationRequestValidator<TContext> {
  /**
   * Instantiates a new Dynamic Registration Request Validator.
   *
   * @param scopeHandler Instance of the Scope Handler.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    protected readonly scopeHandler: ScopeHandler,
    protected readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    protected readonly accessTokenService: AccessTokenServiceInterface,
    protected readonly settings: Settings,
  ) {
    super();
  }

  /**
   * Validates the Registration Request and returns the actors of the Registration Context.
   *
   * @param request Http Request.
   * @returns Dynamic Client Registration Context.
   */
  public async validate(request: HttpRequest): Promise<TContext> {
    const parameters = request.json<PostRegistrationRequest | PutBodyRegistrationRequest>();

    if (!isPlainObject(parameters)) {
      throw new InvalidRequestException('Invalid Http Request Body.');
    }

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

    this.checkSubjectTypeAndSectorIdentifierUri(parameters);

    const subjectType = this.getSubjectType(parameters);
    const sectorIdentifierUri = this.getSectorIdentifierUri(parameters);
    const idTokenSignedResponseAlgorithm = this.getIdTokenSignedResponseAlgorithm(parameters);
    const idTokenEncryptedResponseKeyWrap = this.getIdTokenEncryptedResponseKeyWrap(parameters);
    const idTokenEncryptedResponseContentEncryption = this.getIdTokenEncryptedResponseContentEncryption(parameters);
    const userinfoSignedResponseAlgorithm = this.getUserinfoSignedResponseAlgorithm(parameters);
    const userinfoEncryptedResponseKeyWrap = this.getUserinfoEncryptedResponseKeyWrap(parameters);
    const userinfoEncryptedResponseContentEncryption = this.getUserinfoEncryptedResponseContentEncryption(parameters);
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
    const postLogoutRedirectUris = this.getPostLogoutRedirectUris(parameters);

    this.checkApplicationTypeAndPostLogoutRedirectUris(applicationType, postLogoutRedirectUris);

    const softwareId = this.getSoftwareId(parameters);
    const softwareVersion = this.getSoftwareVersion(parameters);

    return <TContext>{
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
      subjectType,
      sectorIdentifierUri,
      idTokenSignedResponseAlgorithm,
      idTokenEncryptedResponseKeyWrap,
      idTokenEncryptedResponseContentEncryption,
      userinfoSignedResponseAlgorithm,
      userinfoEncryptedResponseKeyWrap,
      userinfoEncryptedResponseContentEncryption,
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
      postLogoutRedirectUris,
      softwareId,
      softwareVersion,
    };
  }

  /**
   * Checks and returns the Redirect URIs of the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Redirect URIs of the Client.
   */
  private getRedirectUris(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): URL[] {
    if (
      !Array.isArray(parameters.redirect_uris) ||
      parameters.redirect_uris.some((redirectUri) => typeof redirectUri !== 'string')
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "redirect_uris".');
    }

    return parameters.redirect_uris.map((redirectUri) => {
      let url: URL;

      try {
        url = new URL(redirectUri);
      } catch (exc: unknown) {
        throw new InvalidRedirectUriException(`Invalid Redirect URI "${redirectUri}".`);
      }

      if (url.hash.length !== 0) {
        throw new InvalidRedirectUriException(`The Redirect URI "${redirectUri}" MUST NOT have a fragment component.`);
      }

      return url;
    });
  }

  /**
   * Returns the Response Types requested by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Response Types requested by the Client.
   */
  private getResponseTypes(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): ResponseType[] {
    if (
      typeof parameters.response_types !== 'undefined' &&
      (!Array.isArray(parameters.response_types) ||
        parameters.response_types.some((responseType) => typeof responseType !== 'string'))
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "response_types".');
    }

    if (typeof parameters.response_types === 'undefined') {
      return ['code'];
    }

    return parameters.response_types.map<ResponseType>((responseType) => {
      if (!this.settings.responseTypes.includes(responseType)) {
        throw new InvalidClientMetadataException(`Unsupported response_type "${responseType}".`);
      }

      return responseType;
    });
  }

  /**
   * Returns the Grant Types requested by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Grant Types requested by the Client.
   */
  private getGrantTypes(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): (GrantType | 'implicit')[] {
    if (
      typeof parameters.grant_types !== 'undefined' &&
      (!Array.isArray(parameters.grant_types) ||
        parameters.grant_types.some((grantType) => typeof grantType !== 'string'))
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "grant_types".');
    }

    if (typeof parameters.grant_types === 'undefined') {
      return ['authorization_code'];
    }

    return parameters.grant_types.map((grantType) => {
      if (grantType !== 'implicit' && !this.settings.grantTypes.includes(grantType)) {
        throw new InvalidClientMetadataException(`Unsupported grant_type "${grantType}".`);
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
      throw new InvalidClientMetadataException(
        'The Response Type "code" requires the Grant Type "authorization_code".',
      );
    }

    // "id_token", "id_token token", "token" and "implicit"
    if (implicitResponseTypes.some(responseTypesIncludes) && !grantTypes.includes('implicit')) {
      const implicitResponseTypesString = implicitResponseTypes.join('", "');

      throw new InvalidClientMetadataException(
        `The Response Types ["${implicitResponseTypesString}"] require the Grant Type "implicit".`,
      );
    }

    // "code id_token", "code id_token token", "code token" and "authorization_code", "implicit"
    if (hybridResponseTypes.some(responseTypesIncludes) && !hybridGrantTypes.every(grantTypesIncludes)) {
      const hybridResponseTypesString = hybridResponseTypes.join('", "');
      const hybridGrantTypesString = hybridGrantTypes.join('", "');

      throw new InvalidClientMetadataException(
        `The Response Types ["${hybridResponseTypesString}"] require the Grant Types ["${hybridGrantTypesString}"].`,
      );
    }

    // "authorization_code" and "code", "code id_token", "code id_token token", "code token"
    if (
      grantTypes.includes('authorization_code') &&
      !authorizationCodeResponseTypes.some(responseTypesIncludes) &&
      !hybridResponseTypes.some(responseTypesIncludes)
    ) {
      const codeResponseTypesString = authorizationCodeResponseTypes.concat(hybridResponseTypes).join('", "');

      throw new InvalidClientMetadataException(
        `The Grant Type "authorization_code" requires at lease one of the Response Types ["${codeResponseTypesString}"].`,
      );
    }

    // "implicit" and "code id_token", "code id_token token", "code token", "id_token", "id_token id_token", "token"
    if (
      grantTypes.includes('implicit') &&
      !hybridResponseTypes.some(responseTypesIncludes) &&
      !implicitResponseTypes.some(responseTypesIncludes)
    ) {
      const implicitResponseTypesString = hybridResponseTypes.concat(implicitResponseTypes).join('", "');

      throw new InvalidClientMetadataException(
        `The Grant Type "implicit" requires at lease one of the Response Types ["${implicitResponseTypesString}"].`,
      );
    }
  }

  /**
   * Returns the Application Type requested by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Application Type requested by the Client.
   */
  private getApplicationType(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): ApplicationType {
    if (typeof parameters.application_type !== 'undefined' && typeof parameters.application_type !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "application_type".');
    }

    if (typeof parameters.application_type === 'undefined') {
      return 'web';
    }

    if (parameters.application_type !== 'native' && parameters.application_type !== 'web') {
      throw new InvalidClientMetadataException(`Unsupported application_type "${parameters.application_type}".`);
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
            throw new InvalidRedirectUriException(
              'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
            );
          }

          break;
        }

        case 'web': {
          if (!redirectUri.protocol.includes('https')) {
            throw new InvalidRedirectUriException(
              `The Redirect URI "${redirectUri.href}" does not use the https protocol.`,
            );
          }

          if (redirectUri.hostname === 'localhost' || redirectUri.hostname === '127.0.0.1') {
            throw new InvalidRedirectUriException(
              'The Authorization Server disallows using localhost as a Redirect URI for a "web" application.',
            );
          }

          break;
        }
      }
    });
  }

  /**
   * Returns the Client Name provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Client Name provided by the Client.
   */
  private getClientName(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<string> {
    if (typeof parameters.client_name !== 'undefined' && typeof parameters.client_name !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "client_name".');
    }

    return parameters.client_name ?? null;
  }

  /**
   * Returns the Scopes requested by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Scopes requested by the Client.
   */
  private getScopes(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): string[] {
    if (typeof parameters.scope !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "scope".');
    }

    try {
      this.scopeHandler.checkRequestedScope(parameters.scope);
    } catch (exc: unknown) {
      throw exc instanceof InvalidScopeException ? new InvalidClientMetadataException(exc.message) : exc;
    }

    return parameters.scope.split(' ');
  }

  /**
   * Returns the Contacts requested by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Contacts requested by the Client.
   */
  private getContacts(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<string[]> {
    if (
      typeof parameters.contacts !== 'undefined' &&
      (!Array.isArray(parameters.contacts) || parameters.contacts.some((contact) => typeof contact !== 'string'))
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "contacts".');
    }

    return parameters.contacts ?? null;
  }

  /**
   * Returns the Logo URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Logo URI provided by the Client.
   */
  private getLogoUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    if (typeof parameters.logo_uri !== 'undefined' && typeof parameters.logo_uri !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "logo_uri".');
    }

    if (typeof parameters.logo_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.logo_uri);
    } catch (exc: unknown) {
      throw new InvalidClientMetadataException('Invalid Logo URI.');
    }
  }

  /**
   * Returns the Client URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Client URI provided by the Client.
   */
  private getClientUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    if (typeof parameters.client_uri !== 'undefined' && typeof parameters.client_uri !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "client_uri".');
    }

    if (typeof parameters.client_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.client_uri);
    } catch (exc: unknown) {
      throw new InvalidClientMetadataException('Invalid Client URI.');
    }
  }

  /**
   * Returns the Policy URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Policy URI provided by the Client.
   */
  private getPolicyUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    if (typeof parameters.policy_uri !== 'undefined' && typeof parameters.policy_uri !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "policy_uri".');
    }

    if (typeof parameters.policy_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.policy_uri);
    } catch (exc: unknown) {
      throw new InvalidClientMetadataException('Invalid Policy URI.');
    }
  }

  /**
   * Returns the Terms of Service URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Terms of Service URI provided by the Client.
   */
  private getTosUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    if (typeof parameters.tos_uri !== 'undefined' && typeof parameters.tos_uri !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "tos_uri".');
    }

    if (typeof parameters.tos_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.tos_uri);
    } catch (exc: unknown) {
      throw new InvalidClientMetadataException('Invalid Terms of Service URI.');
    }
  }

  /**
   * Checks if only one of **jwks_uri** and **jwks** is provided.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   */
  private checkJwksUriAndJwksAreNotBothProvided(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): void {
    if (typeof parameters.jwks_uri !== 'undefined' && typeof parameters.jwks !== 'undefined') {
      throw new InvalidClientMetadataException('Only one of the parameters "jwks_uri" and "jwks" must be provided.');
    }
  }

  /**
   * Returns the JSON Web Key Set URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns JSON Web Key Set URI provided by the Client.
   */
  private getJwksUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    if (typeof parameters.jwks_uri !== 'undefined' && typeof parameters.jwks_uri !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "jwks_uri".');
    }

    if (typeof parameters.jwks_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.jwks_uri);
    } catch (exc: unknown) {
      throw new InvalidClientMetadataException('Invalid JSON Web Key Set URI.');
    }
  }

  /**
   * Returns the JSON Web Key Set provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns JSON Web Key Set provided by the Client.
   */
  private async getJwks(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Promise<Nullable<JsonWebKeySet>> {
    if (typeof parameters.jwks !== 'undefined' && !isPlainObject(parameters.jwks)) {
      throw new InvalidClientMetadataException('Invalid parameter "jwks".');
    }

    if (typeof parameters.jwks === 'undefined') {
      return null;
    }

    try {
      return await JsonWebKeySet.load(parameters.jwks);
    } catch (exc: unknown) {
      throw new InvalidClientMetadataException('Invalid JSON Web Key Set.', { cause: exc });
    }
  }

  /**
   * Checks if the parameter **sector_identifier_uri** is provided when **subject_type** is `pairwise`.
   *
   * @param parameters Parameters of the Client Registration Request.
   */
  private checkSubjectTypeAndSectorIdentifierUri(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): void {
    if (parameters.subject_type === 'pairwise' && typeof parameters.sector_identifier_uri === 'undefined') {
      throw new InvalidClientMetadataException('The Subject Type "pairwise" requires a Sector Identifier URI.');
    }
  }

  /**
   * Returns the Subject Type provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Subject Type provided by the Client.
   */
  private getSubjectType(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): SubjectType {
    if (typeof parameters.subject_type !== 'undefined' && typeof parameters.subject_type !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "subject_type".');
    }

    if (typeof parameters.subject_type === 'undefined') {
      return 'public';
    }

    if (!this.settings.subjectTypes.includes(parameters.subject_type)) {
      throw new InvalidClientMetadataException(`Unsupported subject_type "${parameters.subject_type}".`);
    }

    return parameters.subject_type;
  }

  /**
   * Returns the Sector Identifier URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Sector Identifier URI provided by the Client.
   */
  private getSectorIdentifierUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    if (
      typeof parameters.sector_identifier_uri !== 'undefined' &&
      typeof parameters.sector_identifier_uri !== 'string'
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "sector_identifier_uri".');
    }

    if (typeof parameters.sector_identifier_uri === 'undefined') {
      return null;
    }

    let url: URL;

    try {
      url = new URL(parameters.sector_identifier_uri);
    } catch (exc: unknown) {
      throw new InvalidClientMetadataException('Invalid Sector Identifier URI.');
    }

    if (!url.protocol.includes('https')) {
      throw new InvalidClientMetadataException('The Sector Identifier URI does not use the https protocol.');
    }

    return url;
  }

  /**
   * Returns the ID Token JSON Web Signature Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns ID Token JSON Web Signature Algorithm provided by the Client.
   */
  private getIdTokenSignedResponseAlgorithm(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Exclude<JsonWebSignatureAlgorithm, 'none'> {
    if (
      typeof parameters.id_token_signed_response_alg !== 'undefined' &&
      typeof parameters.id_token_signed_response_alg !== 'string'
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "id_token_signed_response_alg".');
    }

    if (typeof parameters.id_token_signed_response_alg === 'undefined') {
      return 'RS256';
    }

    if (!this.settings.idTokenSignatureAlgorithms.includes(parameters.id_token_signed_response_alg)) {
      throw new InvalidClientMetadataException(
        `Unsupported id_token_signed_response_alg "${parameters.id_token_signed_response_alg}".`,
      );
    }

    return parameters.id_token_signed_response_alg;
  }

  /**
   * Returns the ID Token JSON Web Encryption Key Wrap Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns ID Token JSON Web Encryption Key Wrap Algorithm provided by the Client.
   */
  private getIdTokenEncryptedResponseKeyWrap(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<JsonWebEncryptionKeyWrapAlgorithm> {
    if (
      typeof parameters.id_token_encrypted_response_alg !== 'undefined' &&
      typeof parameters.id_token_encrypted_response_alg !== 'string'
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "id_token_encrypted_response_alg".');
    }

    if (typeof parameters.id_token_encrypted_response_alg === 'undefined') {
      return null;
    }

    if (this.settings.idTokenKeyWrapAlgorithms?.includes(parameters.id_token_encrypted_response_alg) !== true) {
      throw new InvalidClientMetadataException(
        `Unsupported id_token_encrypted_response_alg "${parameters.id_token_encrypted_response_alg}".`,
      );
    }

    return parameters.id_token_encrypted_response_alg;
  }

  /**
   * Returns the ID Token JSON Web Encryption Content Encryption Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns ID Token JSON Web Encryption Content Encryption Algorithm provided by the Client.
   */
  private getIdTokenEncryptedResponseContentEncryption(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<JsonWebEncryptionContentEncryptionAlgorithm> {
    if (
      typeof parameters.id_token_encrypted_response_enc !== 'undefined' &&
      typeof parameters.id_token_encrypted_response_enc !== 'string'
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "id_token_encrypted_response_enc".');
    }

    if (
      typeof parameters.id_token_encrypted_response_enc !== 'undefined' &&
      typeof parameters.id_token_encrypted_response_alg === 'undefined'
    ) {
      throw new InvalidClientMetadataException(
        'The parameter "id_token_encrypted_response_enc" must be presented together ' +
          'with the parameter "id_token_encrypted_response_alg".',
      );
    }

    if (
      typeof parameters.id_token_encrypted_response_enc !== 'undefined' &&
      this.settings.idTokenContentEncryptionAlgorithms?.includes(parameters.id_token_encrypted_response_enc) !== true
    ) {
      throw new InvalidClientMetadataException(
        `Unsupported id_token_encrypted_response_enc "${parameters.id_token_encrypted_response_enc}".`,
      );
    }

    if (typeof parameters.id_token_encrypted_response_enc === 'string') {
      return parameters.id_token_encrypted_response_enc;
    }

    return typeof parameters.id_token_encrypted_response_alg === 'string' ? 'A128CBC-HS256' : null;
  }

  /**
   * Returns the Userinfo JSON Web Signature Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Userinfo JSON Web Signature Algorithm provided by the Client.
   */
  private getUserinfoSignedResponseAlgorithm(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>> {
    if (
      typeof parameters.userinfo_signed_response_alg !== 'undefined' &&
      typeof parameters.userinfo_signed_response_alg !== 'string'
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "userinfo_signed_response_alg".');
    }

    if (typeof parameters.userinfo_signed_response_alg === 'undefined') {
      return null;
    }

    if (this.settings.userinfoSignatureAlgorithms?.includes(parameters.userinfo_signed_response_alg) !== true) {
      throw new InvalidClientMetadataException(
        `Unsupported userinfo_signed_response_alg "${parameters.userinfo_signed_response_alg}".`,
      );
    }

    return parameters.userinfo_signed_response_alg;
  }

  /**
   * Returns the Userinfo JSON Web Encryption Key Wrap Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Userinfo JSON Web Encryption Key Wrap Algorithm provided by the Client.
   */
  private getUserinfoEncryptedResponseKeyWrap(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<JsonWebEncryptionKeyWrapAlgorithm> {
    if (
      typeof parameters.userinfo_encrypted_response_alg !== 'undefined' &&
      typeof parameters.userinfo_encrypted_response_alg !== 'string'
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "userinfo_encrypted_response_alg".');
    }

    if (typeof parameters.userinfo_encrypted_response_alg === 'undefined') {
      return null;
    }

    if (typeof parameters.userinfo_signed_response_alg === 'undefined') {
      throw new InvalidClientMetadataException(
        'The parameter "userinfo_encrypted_response_alg" must be presented together ' +
          'with the parameter "userinfo_signed_response_alg".',
      );
    }

    if (this.settings.userinfoKeyWrapAlgorithms?.includes(parameters.userinfo_encrypted_response_alg) !== true) {
      throw new InvalidClientMetadataException(
        `Unsupported userinfo_encrypted_response_alg "${parameters.userinfo_encrypted_response_alg}".`,
      );
    }

    return parameters.userinfo_encrypted_response_alg;
  }

  /**
   * Returns the Userinfo JSON Web Encryption Content Encryption Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Userinfo JSON Web Encryption Content Encryption Algorithm provided by the Client.
   */
  private getUserinfoEncryptedResponseContentEncryption(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<JsonWebEncryptionContentEncryptionAlgorithm> {
    if (
      typeof parameters.userinfo_encrypted_response_enc !== 'undefined' &&
      typeof parameters.userinfo_encrypted_response_enc !== 'string'
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "userinfo_encrypted_response_enc".');
    }

    if (
      typeof parameters.userinfo_encrypted_response_enc !== 'undefined' &&
      typeof parameters.userinfo_encrypted_response_alg === 'undefined'
    ) {
      throw new InvalidClientMetadataException(
        'The parameter "userinfo_encrypted_response_enc" must be presented together ' +
          'with the parameter "userinfo_encrypted_response_alg".',
      );
    }

    if (
      typeof parameters.userinfo_encrypted_response_enc !== 'undefined' &&
      this.settings.userinfoContentEncryptionAlgorithms?.includes(parameters.userinfo_encrypted_response_enc) !== true
    ) {
      throw new InvalidClientMetadataException(
        `Unsupported userinfo_encrypted_response_enc "${parameters.userinfo_encrypted_response_enc}".`,
      );
    }

    if (typeof parameters.userinfo_encrypted_response_enc === 'string') {
      return parameters.userinfo_encrypted_response_enc;
    }

    return typeof parameters.userinfo_encrypted_response_alg === 'string' ? 'A128CBC-HS256' : null;
  }

  // private getRequestObjectSigningAlgorithm(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>> {}

  // private getRequestObjectEncryptionKeyWrap(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<JsonWebEncryptionKeyWrapAlgorithm> {}

  // private getRequestObjectEncryptionContentEncryption(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<JsonWebEncryptionContentEncryptionAlgorithm> {}

  /**
   * Returns the Client Authentication Method provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Client Authentication Method provided by the Client.
   */
  private getAuthenticationMethod(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): ClientAuthentication {
    if (
      typeof parameters.token_endpoint_auth_method !== 'undefined' &&
      typeof parameters.token_endpoint_auth_method !== 'string'
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "token_endpoint_auth_method".');
    }

    if (typeof parameters.token_endpoint_auth_method === 'undefined') {
      return 'client_secret_basic';
    }

    if (!this.settings.clientAuthenticationMethods.includes(parameters.token_endpoint_auth_method)) {
      throw new InvalidClientMetadataException(
        `Unsupported token_endpoint_auth_method "${parameters.token_endpoint_auth_method}".`,
      );
    }

    return parameters.token_endpoint_auth_method;
  }

  /**
   * Returns the Client Authentication Method JSON Web Signature Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Client Authentication Method JSON Web Signature Algorithm provided by the Client.
   */
  private getAuthenticationSigningAlgorithm(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>> {
    if (
      typeof parameters.token_endpoint_auth_signing_alg !== 'undefined' &&
      typeof parameters.token_endpoint_auth_signing_alg !== 'string'
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "token_endpoint_auth_signing_alg".');
    }

    if (
      typeof parameters.token_endpoint_auth_signing_alg !== 'undefined' &&
      !this.settings.clientAuthenticationSignatureAlgorithms.includes(parameters.token_endpoint_auth_signing_alg)
    ) {
      throw new InvalidClientMetadataException(
        `Unsupported token_endpoint_auth_signing_alg "${parameters.token_endpoint_auth_signing_alg}".`,
      );
    }

    return parameters.token_endpoint_auth_signing_alg ?? null;
  }

  /**
   * Checks if the JSON Web Signature Algorithm provided by the Client for JWT Client Assertion
   * is valid for the Client Authentication Method provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   */
  private checkAuthenticationMethodAndAuthenticationMethodSignature(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): void {
    const {
      token_endpoint_auth_method: authenticationMethod,
      token_endpoint_auth_signing_alg: authenticationSigningAlgorithm,
    } = parameters;

    if (authenticationMethod !== 'client_secret_jwt' && authenticationMethod !== 'private_key_jwt') {
      if (typeof authenticationSigningAlgorithm === 'undefined') {
        return;
      }

      throw new InvalidClientMetadataException(
        `The Client Authentication Method "${authenticationMethod}" ` +
          'does not require a Client Authentication Signing Algorithm.',
      );
    }

    if (typeof authenticationSigningAlgorithm === 'undefined') {
      throw new InvalidClientMetadataException(
        'Missing required parameter "token_endpoint_auth_signing_alg" ' +
          `for Client Authentication Method "${authenticationMethod}".`,
      );
    }

    if (typeof parameters.jwks === 'undefined' && typeof parameters.jwks_uri === 'undefined') {
      throw new InvalidClientMetadataException(
        'One of the parameters "jwks_uri" or "jwks" must be provided ' +
          `for Client Authentication Method "${authenticationMethod}".`,
      );
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
      throw new InvalidClientMetadataException(
        `Invalid JSON Web Signature Algorithm "${authenticationSigningAlgorithm}" ` +
          `for Client Authentication Method "${authenticationMethod}".`,
      );
    }
  }

  /**
   * Returns the Default Max Age provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Default Max Age provided by the Client.
   */
  private getDefaultMaxAge(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<number> {
    if (typeof parameters.default_max_age === 'undefined') {
      return null;
    }

    if (typeof parameters.default_max_age !== 'number') {
      throw new InvalidClientMetadataException('Invalid parameter "default_max_age".');
    }

    if (!Number.isInteger(parameters.default_max_age) || parameters.default_max_age <= 0) {
      throw new InvalidClientMetadataException('The default max age must be a positive integer.');
    }

    return parameters.default_max_age;
  }

  /**
   * Returns the value for Require Auth Time provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Value for Require Auth Time provided by the Client.
   */
  private getRequireAuthTime(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): boolean {
    if (typeof parameters.require_auth_time !== 'undefined' && typeof parameters.require_auth_time !== 'boolean') {
      throw new InvalidClientMetadataException('Invalid parameter "require_auth_time".');
    }

    return parameters.require_auth_time ?? false;
  }

  /**
   * Returns the Default Authentication Context Class References requested by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Default Authentication Context Class References requested by the Client.
   */
  private getDefaultAcrValues(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<string[]> {
    if (
      typeof parameters.default_acr_values !== 'undefined' &&
      (!Array.isArray(parameters.default_acr_values) ||
        parameters.default_acr_values.some((acrValue) => typeof acrValue !== 'string'))
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "default_acr_values".');
    }

    if (typeof parameters.default_acr_values === 'undefined') {
      return null;
    }

    return parameters.default_acr_values.map<string>((acrValue) => {
      if (!this.settings.acrValues.includes(acrValue)) {
        throw new InvalidClientMetadataException(`Unsupported acr_value "${acrValue}".`);
      }

      return acrValue;
    });
  }

  /**
   * Returns the Initiate Login URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Initiate Login URI provided by the Client.
   */
  private getInitiateLoginUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    if (typeof parameters.initiate_login_uri !== 'undefined' && typeof parameters.initiate_login_uri !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "initiate_login_uri".');
    }

    if (typeof parameters.initiate_login_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.initiate_login_uri);
    } catch (exc: unknown) {
      throw new InvalidClientMetadataException('Invalid Initiate Login URI.');
    }
  }

  // private getRequestUris(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL[]> {}

  /**
   * Checks and returns the Post Logout Redirect URIs of the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Post Logout Redirect URIs of the Client.
   */
  private getPostLogoutRedirectUris(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL[]> {
    if (typeof parameters.post_logout_redirect_uris === 'undefined') {
      return null;
    }

    if (
      !Array.isArray(parameters.post_logout_redirect_uris) ||
      parameters.post_logout_redirect_uris.some((postLogoutRedirectUri) => typeof postLogoutRedirectUri !== 'string')
    ) {
      throw new InvalidClientMetadataException('Invalid parameter "post_logout_redirect_uris".');
    }

    return parameters.post_logout_redirect_uris.map((postLogoutRedirectUri) => {
      let url: URL;

      try {
        url = new URL(postLogoutRedirectUri);
      } catch (exc: unknown) {
        throw new InvalidClientMetadataException(`Invalid Post Logout Redirect URI "${postLogoutRedirectUri}".`);
      }

      if (url.hash.length !== 0) {
        throw new InvalidClientMetadataException(
          `The Post Logout Redirect URI "${postLogoutRedirectUri}" MUST NOT have a fragment component.`,
        );
      }

      return url;
    });
  }

  /**
   * Checks if the Post Logout Redirect URIs provided by the Client match the requirements of the requested Application Type.
   *
   * @param applicationType Application Type requested by the Client.
   * @param postLogoutRedirectUris Post Logout Redirect URIs provided by the Client.
   */
  private checkApplicationTypeAndPostLogoutRedirectUris(
    applicationType: ApplicationType,
    postLogoutRedirectUris: Nullable<URL[]>,
  ): void {
    if (postLogoutRedirectUris === null) {
      return;
    }

    postLogoutRedirectUris.forEach((postLogoutRedirectUri) => {
      switch (applicationType) {
        case 'native': {
          if (postLogoutRedirectUri.protocol.includes('http') && postLogoutRedirectUri.hostname !== 'localhost') {
            throw new InvalidClientMetadataException(
              'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
            );
          }

          break;
        }

        case 'web': {
          if (!postLogoutRedirectUri.protocol.includes('https')) {
            throw new InvalidClientMetadataException(
              `The Post Logout Redirect URI "${postLogoutRedirectUri.href}" does not use the https protocol.`,
            );
          }

          if (postLogoutRedirectUri.hostname === 'localhost' || postLogoutRedirectUri.hostname === '127.0.0.1') {
            throw new InvalidClientMetadataException(
              'The Authorization Server disallows using localhost as a Post Logout Redirect URI for a "web" application.',
            );
          }

          break;
        }
      }
    });
  }

  /**
   * Returns the Software Identifier provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Software Identifier provided by the Client.
   */
  private getSoftwareId(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<string> {
    if (typeof parameters.software_id !== 'undefined' && typeof parameters.software_id !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "software_id".');
    }

    return parameters.software_id ?? null;
  }

  /**
   * Returns the Software Version provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Software Version provided by the Client.
   */
  private getSoftwareVersion(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<string> {
    if (typeof parameters.software_version !== 'undefined' && typeof parameters.software_version !== 'string') {
      throw new InvalidClientMetadataException('Invalid parameter "software_version".');
    }

    return parameters.software_version ?? null;
  }
}
