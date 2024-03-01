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
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param scopeHandler Instance of the Scope Handler.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    protected readonly logger: Logger,
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
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '383e0659-c7bf-419d-8ecd-6ddbb9a33d16', {
      request,
    });

    const parameters = request.json<PostRegistrationRequest | PutBodyRegistrationRequest>();

    if (!isPlainObject(parameters)) {
      const exc = new InvalidRequestException('Invalid Http Request Body.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Http Request Body`,
        '832fbfd4-b2cc-4443-8cbe-7c3168de1242',
        null,
        exc,
      );

      throw exc;
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
    const authorizationSignedResponseAlgorithm = this.getAuthorizationSignedResponseAlgorithm(parameters);
    const authorizationEncryptedResponseKeyWrap = this.getAuthorizationEncryptedResponseKeyWrap(parameters);
    const authorizationEncryptedResponseContentEncryption =
      this.getAuthorizationEncryptedResponseContentEncryption(parameters);
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
    this.checkBackChannelLogoutUriAndBackChannelSessionRequired(parameters);

    const backChannelLogoutUri = this.getBackChannelLogoutUri(parameters);
    const backChannelLogoutSessionRequired = this.getBackChannelLogoutSessionRequired(parameters);

    this.checkApplicationTypeAndBackChannelLogoutUri(applicationType, backChannelLogoutUri);

    const softwareId = this.getSoftwareId(parameters);
    const softwareVersion = this.getSoftwareVersion(parameters);

    const context = <TContext>{
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
      authorizationSignedResponseAlgorithm,
      authorizationEncryptedResponseKeyWrap,
      authorizationEncryptedResponseContentEncryption,
      authenticationMethod,
      authenticationSigningAlgorithm,
      defaultMaxAge,
      requireAuthTime,
      defaultAcrValues,
      initiateLoginUri,
      // requestUris,
      postLogoutRedirectUris,
      backChannelLogoutUri,
      backChannelLogoutSessionRequired,
      softwareId,
      softwareVersion,
    };

    const method = request.method.charAt(0) + request.method.slice(1).toLowerCase();

    this.logger.debug(
      `[${this.constructor.name}] ${method} Registration Request validation completed`,
      '4b5738b5-1424-45fc-a724-02b458795ad4',
      { context },
    );

    return context;
  }

  /**
   * Checks and returns the Redirect URIs of the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Redirect URIs of the Client.
   */
  private getRedirectUris(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): URL[] {
    this.logger.debug(`[${this.constructor.name}] Called getRedirectUris()`, '5fa1aaf3-62fb-41aa-b7c6-3f29bf30dd9b', {
      parameters,
    });

    if (
      !Array.isArray(parameters.redirect_uris) ||
      parameters.redirect_uris.some((redirectUri) => typeof redirectUri !== 'string')
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "redirect_uris".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "redirect_uris"`,
        '13c8825a-ebd2-4752-9eb6-94a37af03a1b',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.redirect_uris.map((redirectUri) => {
      let url: URL;

      try {
        url = new URL(redirectUri);
      } catch (exc: unknown) {
        const exception = new InvalidRedirectUriException(`Invalid Redirect URI "${redirectUri}".`, { cause: exc });

        this.logger.error(
          `[${this.constructor.name}] Invalid Redirect URI "${redirectUri}"`,
          '003db4ea-4ef6-41d2-a815-4785cb5ebfc8',
          { redirect_uri: redirectUri },
          exception,
        );

        throw exception;
      }

      if (url.hash.length !== 0) {
        const exc = new InvalidRedirectUriException(
          `The Redirect URI "${redirectUri}" MUST NOT have a fragment component.`,
        );

        this.logger.error(
          `[${this.constructor.name}] The Redirect URI "${redirectUri}" MUST NOT have a fragment component`,
          '25685297-3acb-444a-9188-159ed0be7c5f',
          { redirect_uri: redirectUri },
          exc,
        );

        throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getResponseTypes()`, '3d559ab2-0eac-49c2-937d-e1e3250406d2', {
      parameters,
    });

    if (
      typeof parameters.response_types !== 'undefined' &&
      (!Array.isArray(parameters.response_types) ||
        parameters.response_types.some((responseType) => typeof responseType !== 'string'))
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "response_types".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "response_types"`,
        '5c582083-cae6-41ca-aa6f-5f48bad8c246',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.response_types === 'undefined') {
      return ['code'];
    }

    return parameters.response_types.map<ResponseType>((responseType) => {
      if (!this.settings.responseTypes.includes(responseType)) {
        const exc = new InvalidClientMetadataException(`Unsupported response_type "${responseType}".`);

        this.logger.error(
          `[${this.constructor.name}] Unsupported response_type "${responseType}"`,
          'f41f3383-bacb-4f33-8f6b-3e7fd90f856c',
          { response_type: responseType },
          exc,
        );

        throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getGrantTypes()`, '420d8344-c794-4b37-9cf7-47e7ab6593ef', {
      parameters,
    });

    if (
      typeof parameters.grant_types !== 'undefined' &&
      (!Array.isArray(parameters.grant_types) ||
        parameters.grant_types.some((grantType) => typeof grantType !== 'string'))
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "grant_types".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "grant_types"`,
        '5ca74b47-d964-4943-af07-074b3d8bb8ca',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.grant_types === 'undefined') {
      return ['authorization_code'];
    }

    return parameters.grant_types.map((grantType) => {
      if (grantType !== 'implicit' && !this.settings.grantTypes.includes(grantType)) {
        const exc = new InvalidClientMetadataException(`Unsupported grant_type "${grantType}".`);

        this.logger.error(
          `[${this.constructor.name}] Unsupported grant_type "${grantType}"`,
          '9aae34c6-8fa1-4f3b-bf79-f34883cf0d14',
          { grant_type: grantType },
          exc,
        );

        throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called checkResponseTypesAndGrantTypes()`,
      'd99c8387-7bb2-41bd-a859-3a7ce57a8114',
      { response_types: responseTypes, grant_types: grantTypes },
    );

    const authorizationCodeResponseTypes: ResponseType[] = ['code'];
    const implicitResponseTypes: ResponseType[] = ['id_token', 'id_token token', 'token'];
    const hybridResponseTypes: ResponseType[] = ['code id_token', 'code id_token token', 'code token'];

    const hybridGrantTypes: (GrantType | 'implicit')[] = ['authorization_code', 'implicit'];

    const responseTypesIncludes = (responseType: ResponseType) => responseTypes.includes(responseType);
    const grantTypesIncludes = (grantType: GrantType | 'implicit') => grantTypes.includes(grantType);

    // "code" and "authorization_code"
    if (authorizationCodeResponseTypes.some(responseTypesIncludes) && !grantTypes.includes('authorization_code')) {
      const exc = new InvalidClientMetadataException(
        'The Response Type "code" requires the Grant Type "authorization_code".',
      );

      this.logger.error(
        `[${this.constructor.name}] The Response Type "code" requires the Grant Type "authorization_code"`,
        'abc1536b-af27-4ea0-8e39-f10c9a54068f',
        { response_types: responseTypes, grant_types: grantTypes },
        exc,
      );

      throw exc;
    }

    // "id_token", "id_token token", "token" and "implicit"
    if (implicitResponseTypes.some(responseTypesIncludes) && !grantTypes.includes('implicit')) {
      const implicitResponseTypesString = implicitResponseTypes.join('", "');

      const exc = new InvalidClientMetadataException(
        `The Response Types ["${implicitResponseTypesString}"] require the Grant Type "implicit".`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Response Types ["${implicitResponseTypesString}"] require the Grant Type "implicit"`,
        'c092291e-9af3-465b-a5fd-3429a8b40bbf',
        { response_types: responseTypes, grant_types: grantTypes },
        exc,
      );

      throw exc;
    }

    // "code id_token", "code id_token token", "code token" and "authorization_code", "implicit"
    if (hybridResponseTypes.some(responseTypesIncludes) && !hybridGrantTypes.every(grantTypesIncludes)) {
      const hybridResponseTypesString = hybridResponseTypes.join('", "');
      const hybridGrantTypesString = hybridGrantTypes.join('", "');

      const exc = new InvalidClientMetadataException(
        `The Response Types ["${hybridResponseTypesString}"] require the Grant Types ["${hybridGrantTypesString}"].`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Response Types ["${hybridResponseTypesString}"] require the Grant Types ["${hybridGrantTypesString}"]`,
        '71d510f6-8d8b-4481-9a27-434208735c92',
        { response_types: responseTypes, grant_types: grantTypes },
        exc,
      );

      throw exc;
    }

    // "authorization_code" and "code", "code id_token", "code id_token token", "code token"
    if (
      grantTypes.includes('authorization_code') &&
      !authorizationCodeResponseTypes.some(responseTypesIncludes) &&
      !hybridResponseTypes.some(responseTypesIncludes)
    ) {
      const codeResponseTypesString = authorizationCodeResponseTypes.concat(hybridResponseTypes).join('", "');

      const exc = new InvalidClientMetadataException(
        `The Grant Type "authorization_code" requires at lease one of the Response Types ["${codeResponseTypesString}"].`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Grant Type "authorization_code" requires at lease one of the Response Types ["${codeResponseTypesString}"]`,
        '54d3434d-1392-4768-a937-6f51befc7ae3',
        { response_types: responseTypes, grant_types: grantTypes },
        exc,
      );

      throw exc;
    }

    // "implicit" and "code id_token", "code id_token token", "code token", "id_token", "id_token id_token", "token"
    if (
      grantTypes.includes('implicit') &&
      !hybridResponseTypes.some(responseTypesIncludes) &&
      !implicitResponseTypes.some(responseTypesIncludes)
    ) {
      const implicitResponseTypesString = hybridResponseTypes.concat(implicitResponseTypes).join('", "');

      const exc = new InvalidClientMetadataException(
        `The Grant Type "implicit" requires at lease one of the Response Types ["${implicitResponseTypesString}"].`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Grant Type "implicit" requires at lease one of the Response Types ["${implicitResponseTypesString}"]`,
        'f22ccb41-f13f-44b6-99c0-83e09f3c6532',
        { response_types: responseTypes, grant_types: grantTypes },
        exc,
      );

      throw exc;
    }
  }

  /**
   * Returns the Application Type requested by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Application Type requested by the Client.
   */
  private getApplicationType(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): ApplicationType {
    this.logger.debug(
      `[${this.constructor.name}] Called getApplicationType()`,
      '02133801-f4a3-49b1-b428-86579d25fd80',
      { parameters },
    );

    if (typeof parameters.application_type !== 'undefined' && typeof parameters.application_type !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "application_type".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "application_type"`,
        '71726386-5607-4864-a15e-a97b681076b2',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.application_type === 'undefined') {
      return 'web';
    }

    if (parameters.application_type !== 'native' && parameters.application_type !== 'web') {
      const exc = new InvalidClientMetadataException(`Unsupported application_type "${parameters.application_type}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported application_type "${parameters.application_type}"`,
        '15d7931a-0484-46f0-bc28-7aefd50197a8',
        { parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called checkApplicationTypeAndRedirectUris()`,
      '06d7e0be-0d0d-406d-b569-51b7cc37b041',
      { application_type: applicationType, redirect_uris: redirectUris.map((redirectUri) => redirectUri.href) },
    );

    redirectUris.forEach((redirectUri) => {
      switch (applicationType) {
        case 'native': {
          if (redirectUri.protocol.includes('http') && redirectUri.hostname !== 'localhost') {
            const exc = new InvalidRedirectUriException(
              'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
            );

            this.logger.error(
              `[${this.constructor.name}] The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application`,
              'f837ddfb-fe82-4a0b-88f0-6ba1b54bf417',
              { redirect_uri: redirectUri.href },
              exc,
            );

            throw exc;
          }

          break;
        }

        case 'web': {
          if (!redirectUri.protocol.includes('https')) {
            const exc = new InvalidRedirectUriException(
              `The Redirect URI "${redirectUri.href}" does not use the https protocol.`,
            );

            this.logger.error(
              `[${this.constructor.name}] The Redirect URI "${redirectUri.href}" does not use the https protocol`,
              'd486dd40-eed3-4320-b1a7-17f2f9c3aa26',
              { redirect_uri: redirectUri.href },
              exc,
            );

            throw exc;
          }

          if (redirectUri.hostname === 'localhost' || redirectUri.hostname === '127.0.0.1') {
            const exc = new InvalidRedirectUriException(
              'The Authorization Server disallows using localhost as a Redirect URI for a "web" application.',
            );

            this.logger.error(
              `[${this.constructor.name}] The Authorization Server disallows using localhost as a Redirect URI for a "web" application`,
              '80b65c25-2e65-47e8-bffa-f975e4b4a1dc',
              { redirect_uri: redirectUri.href },
              exc,
            );

            throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getClientName()`, '69c0da13-582a-430a-a7f0-20292633a1da', {
      parameters,
    });

    if (typeof parameters.client_name !== 'undefined' && typeof parameters.client_name !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "client_name".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "client_name"`,
        'd7925d1b-ee36-4630-8a4f-3f391a7c3c22',
        { parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getScopes()`, 'bee46046-4793-49bf-911d-96f8894cf283', {
      parameters,
    });

    if (typeof parameters.scope !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "scope".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "scope"`,
        '7a863862-3dc4-49dc-a009-14230e1dc687',
        { parameters },
        exc,
      );

      throw exc;
    }

    try {
      this.scopeHandler.checkRequestedScope(parameters.scope);
    } catch (exc: unknown) {
      const exception =
        exc instanceof InvalidScopeException ? new InvalidClientMetadataException(exc.message, { cause: exc }) : exc;

      this.logger.error(
        `[${this.constructor.name}] ${(<OAuth2Exception>exception).message}`,
        '03c07a43-2b31-40dd-a52d-c63171a8b900',
        { parameters },
        <OAuth2Exception>exception,
      );

      throw exception;
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
    this.logger.debug(`[${this.constructor.name}] Called getContacts()`, '9dd1b511-42cb-4316-86aa-f76c01112b24', {
      parameters,
    });

    if (
      typeof parameters.contacts !== 'undefined' &&
      (!Array.isArray(parameters.contacts) || parameters.contacts.some((contact) => typeof contact !== 'string'))
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "contacts".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "contacts"`,
        '0c886ce2-d9b5-44eb-a057-3c1db93f1519',
        { parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getLogoUri()`, 'dee1fd94-e9f7-4760-bac6-171b7be390aa', {
      parameters,
    });

    if (typeof parameters.logo_uri !== 'undefined' && typeof parameters.logo_uri !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "logo_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "logo_uri"`,
        'cabbafc7-d09a-4ecc-af59-563967721cf1',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.logo_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.logo_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException('Invalid Logo URI.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid Logo URI`,
        '690c19ee-7f7a-4099-9046-88c339d6a78c',
        { parameters },
        exception,
      );

      throw exception;
    }
  }

  /**
   * Returns the Client URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Client URI provided by the Client.
   */
  private getClientUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    this.logger.debug(`[${this.constructor.name}] Called getClientUri()`, '8f225887-cfc4-4195-a5f2-1eb7aea68bb0', {
      parameters,
    });

    if (typeof parameters.client_uri !== 'undefined' && typeof parameters.client_uri !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "client_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "client_uri"`,
        '2fcafb51-f17a-41ec-b4e1-e9115d5e9f6f',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.client_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.client_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException('Invalid Client URI.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid Client URI`,
        '4d3396f1-fe47-4c4f-a534-0bd37a635b1e',
        { parameters },
        exception,
      );

      throw exception;
    }
  }

  /**
   * Returns the Policy URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Policy URI provided by the Client.
   */
  private getPolicyUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    this.logger.debug(`[${this.constructor.name}] Called getPolicyUri()`, 'ed2b67b8-ace5-46b8-925a-7414b68a3ae0', {
      parameters,
    });

    if (typeof parameters.policy_uri !== 'undefined' && typeof parameters.policy_uri !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "policy_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "policy_uri"`,
        'aa0ed2cb-f71e-44da-8610-ffda21fd553c',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.policy_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.policy_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException('Invalid Policy URI.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid Policy URI`,
        '1b2750cf-9d0d-4f85-a030-7239dc053ce3',
        { parameters },
        exception,
      );

      throw exception;
    }
  }

  /**
   * Returns the Terms of Service URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Terms of Service URI provided by the Client.
   */
  private getTosUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    this.logger.debug(`[${this.constructor.name}] Called getTosUri()`, '4c3a4a96-ece6-4fa7-a365-0a806181fcc4', {
      parameters,
    });

    if (typeof parameters.tos_uri !== 'undefined' && typeof parameters.tos_uri !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "tos_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "tos_uri"`,
        'a05e6714-c384-4143-9b17-95a7cde1fdb2',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.tos_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.tos_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException('Invalid Terms of Service URI.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid Terms of Service URI`,
        '1ba3855a-8af3-4638-99a9-d9e0f5104a3d',
        { parameters },
        exception,
      );

      throw exception;
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
    this.logger.debug(
      `[${this.constructor.name}] Called checkJwksUriAndJwksAreNotBothProvided()`,
      '2aacbc42-22ab-4648-9471-08039b9382c9',
      { parameters },
    );

    if (typeof parameters.jwks_uri !== 'undefined' && typeof parameters.jwks !== 'undefined') {
      const exc = new InvalidClientMetadataException(
        'Only one of the parameters "jwks_uri" and "jwks" must be provided.',
      );

      this.logger.error(
        `[${this.constructor.name}] Only one of the parameters "jwks_uri" and "jwks" must be provided`,
        'b1cb927c-544c-4ae4-9a3a-4f18aec3799f',
        { parameters },
        exc,
      );

      throw exc;
    }
  }

  /**
   * Returns the JSON Web Key Set URI provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns JSON Web Key Set URI provided by the Client.
   */
  private getJwksUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    this.logger.debug(`[${this.constructor.name}] Called getJwksUri()`, 'c923b1bc-3223-4146-bc52-cd91dcedd329', {
      parameters,
    });

    if (typeof parameters.jwks_uri !== 'undefined' && typeof parameters.jwks_uri !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "jwks_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "jwks_uri"`,
        '1ee97c67-94ff-4848-917b-a15ae0a23f91',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.jwks_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.jwks_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException('Invalid JSON Web Key Set URI.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid JSON Web Key Set URI`,
        '5e37a568-9d02-4406-8f5f-a2a7ec2df464',
        { parameters },
        exception,
      );

      throw exception;
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
    this.logger.debug(`[${this.constructor.name}] Called getJwks()`, '47533dc5-6398-4af9-881f-36e2c43427d1', {
      parameters,
    });

    if (typeof parameters.jwks !== 'undefined' && !isPlainObject(parameters.jwks)) {
      const exc = new InvalidClientMetadataException('Invalid parameter "jwks".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "jwks"`,
        '4a2760de-57bd-465d-837e-dd46bcd5bbeb',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.jwks === 'undefined') {
      return null;
    }

    try {
      return await JsonWebKeySet.load(parameters.jwks);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException('Invalid JSON Web Key Set.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid JSON Web Key Set`,
        'c4e849fa-c81d-423c-9afa-5b7e51aa7ed2',
        { parameters },
        exception,
      );

      throw exception;
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
    this.logger.debug(
      `[${this.constructor.name}] Called checkSubjectTypeAndSectorIdentifierUri()`,
      '275e67af-a1df-4343-9629-ef796d6a9519',
      { parameters },
    );

    if (parameters.subject_type === 'pairwise' && typeof parameters.sector_identifier_uri === 'undefined') {
      const exc = new InvalidClientMetadataException('The Subject Type "pairwise" requires a Sector Identifier URI.');

      this.logger.error(
        `[${this.constructor.name}] The Subject Type "pairwise" requires a Sector Identifier URI`,
        '206c7129-4c20-4392-b7df-ba97c576837c',
        { parameters },
        exc,
      );

      throw exc;
    }
  }

  /**
   * Returns the Subject Type provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Subject Type provided by the Client.
   */
  private getSubjectType(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): SubjectType {
    this.logger.debug(`[${this.constructor.name}] Called getSubjectType()`, '3b134c0a-41dd-412b-9fd8-0d60230ffa52', {
      parameters,
    });

    if (typeof parameters.subject_type !== 'undefined' && typeof parameters.subject_type !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "subject_type".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "subject_type"`,
        '992ff5bf-db8a-410d-bdc8-daa84f70ddb9',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.subject_type === 'undefined') {
      return 'public';
    }

    if (!this.settings.subjectTypes.includes(parameters.subject_type)) {
      const exc = new InvalidClientMetadataException(`Unsupported subject_type "${parameters.subject_type}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported subject_type "${parameters.subject_type}"`,
        '66a97d9e-f89c-4224-a6e6-77d2fc9eff84',
        { supported_subject_types: this.settings.subjectTypes, parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getSectorIdentifierUri()`,
      '88ff9fab-de33-4996-9890-2e6e2d2a579b',
      { parameters },
    );

    if (
      typeof parameters.sector_identifier_uri !== 'undefined' &&
      typeof parameters.sector_identifier_uri !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "sector_identifier_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "sector_identifier_uri"`,
        '2819dc05-e80f-40e9-a826-2885755c2c28',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.sector_identifier_uri === 'undefined') {
      return null;
    }

    let url: URL;

    try {
      url = new URL(parameters.sector_identifier_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException('Invalid Sector Identifier URI.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid Sector Identifier URI`,
        '4bbe215e-00bc-4142-a2f8-65e084520673',
        { parameters },
        exception,
      );

      throw exception;
    }

    if (!url.protocol.includes('https')) {
      const exc = new InvalidClientMetadataException('The Sector Identifier URI does not use the https protocol.');

      this.logger.error(
        `[${this.constructor.name}] The Sector Identifier URI does not use the https protocol`,
        'e09e3fd3-657a-44e9-a662-ff6c46e69cc6',
        { sector_identifier_uri: url.href },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getIdTokenSignedResponseAlgorithm()`,
      '75603964-0f11-4a62-8720-b929ba28f6d0',
      { parameters },
    );

    if (
      typeof parameters.id_token_signed_response_alg !== 'undefined' &&
      typeof parameters.id_token_signed_response_alg !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "id_token_signed_response_alg".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "id_token_signed_response_alg"`,
        '86851bad-87e6-46bd-a307-d0af98469cbb',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.id_token_signed_response_alg === 'undefined') {
      return 'RS256';
    }

    if (!this.settings.idTokenSignatureAlgorithms.includes(parameters.id_token_signed_response_alg)) {
      const exc = new InvalidClientMetadataException(
        `Unsupported id_token_signed_response_alg "${parameters.id_token_signed_response_alg}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported id_token_signed_response_alg "${parameters.id_token_signed_response_alg}"`,
        '4d42e3c6-4156-4f38-b6ba-75d4d514e8b2',
        { supported_id_token_signed_response_algs: this.settings.idTokenSignatureAlgorithms, parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getIdTokenEncryptedResponseKeyWrap()`,
      'a4183cec-3d4a-45ee-bdb5-8e3e84cea8a1',
      { parameters },
    );

    if (
      typeof parameters.id_token_encrypted_response_alg !== 'undefined' &&
      typeof parameters.id_token_encrypted_response_alg !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "id_token_encrypted_response_alg".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "id_token_encrypted_response_alg"`,
        '1460be31-ea7f-428d-b602-5b9e517be4af',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.id_token_encrypted_response_alg === 'undefined') {
      return null;
    }

    if (this.settings.idTokenKeyWrapAlgorithms?.includes(parameters.id_token_encrypted_response_alg) !== true) {
      const exc = new InvalidClientMetadataException(
        `Unsupported id_token_encrypted_response_alg "${parameters.id_token_encrypted_response_alg}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported id_token_encrypted_response_alg "${parameters.id_token_encrypted_response_alg}"`,
        'ce43a7dc-8de5-404e-9dab-46fc5f0289ea',
        { supported_id_token_encrypted_response_algs: this.settings.idTokenKeyWrapAlgorithms, parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getIdTokenEncryptedResponseContentEncryption()`,
      'dfabfc5e-8d49-47e7-9fb3-c0ea5b2a91e6',
      { parameters },
    );

    if (
      typeof parameters.id_token_encrypted_response_enc !== 'undefined' &&
      typeof parameters.id_token_encrypted_response_enc !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "id_token_encrypted_response_enc".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "id_token_encrypted_response_enc"`,
        'a8198ffa-15de-4599-858e-41b0436c81f0',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (
      typeof parameters.id_token_encrypted_response_enc !== 'undefined' &&
      typeof parameters.id_token_encrypted_response_alg === 'undefined'
    ) {
      const exc = new InvalidClientMetadataException(
        'The parameter "id_token_encrypted_response_enc" must be presented together ' +
          'with the parameter "id_token_encrypted_response_alg".',
      );

      this.logger.error(
        `[${this.constructor.name}] The parameter "id_token_encrypted_response_enc" must be presented together with the parameter "id_token_encrypted_response_alg"`,
        'dc6d8b1c-6abd-44f2-90c9-4a9041f0777e',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (
      typeof parameters.id_token_encrypted_response_enc !== 'undefined' &&
      this.settings.idTokenContentEncryptionAlgorithms?.includes(parameters.id_token_encrypted_response_enc) !== true
    ) {
      const exc = new InvalidClientMetadataException(
        `Unsupported id_token_encrypted_response_enc "${parameters.id_token_encrypted_response_enc}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported id_token_encrypted_response_enc "${parameters.id_token_encrypted_response_enc}"`,
        '4808b0a6-d7bb-4c2b-9e64-70d5ffa0b212',
        { supported_id_token_encrypted_response_encs: this.settings.idTokenContentEncryptionAlgorithms, parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getUserinfoSignedResponseAlgorithm()`,
      'edc32d50-a048-425e-b32a-075f4f27872d',
      { parameters },
    );

    if (
      typeof parameters.userinfo_signed_response_alg !== 'undefined' &&
      typeof parameters.userinfo_signed_response_alg !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "userinfo_signed_response_alg".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "userinfo_signed_response_alg"`,
        'ad658d7b-2a3e-42da-bf85-85e892e38e94',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.userinfo_signed_response_alg === 'undefined') {
      return null;
    }

    if (this.settings.userinfoSignatureAlgorithms?.includes(parameters.userinfo_signed_response_alg) !== true) {
      const exc = new InvalidClientMetadataException(
        `Unsupported userinfo_signed_response_alg "${parameters.userinfo_signed_response_alg}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported userinfo_signed_response_alg "${parameters.userinfo_signed_response_alg}"`,
        '5035f45c-4964-4b9e-99c3-e92ada1bbd95',
        { supported_userinfo_signed_response_algs: this.settings.userinfoSignatureAlgorithms, parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getUserinfoEncryptedResponseKeyWrap()`,
      '3780ae95-2ae4-4856-9977-21474e003483',
      { parameters },
    );

    if (
      typeof parameters.userinfo_encrypted_response_alg !== 'undefined' &&
      typeof parameters.userinfo_encrypted_response_alg !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "userinfo_encrypted_response_alg".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "userinfo_encrypted_response_alg"`,
        '11ee81bc-a834-4c91-b1e6-e0bd13b0a806',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.userinfo_encrypted_response_alg === 'undefined') {
      return null;
    }

    if (typeof parameters.userinfo_signed_response_alg === 'undefined') {
      const exc = new InvalidClientMetadataException(
        'The parameter "userinfo_encrypted_response_alg" must be presented together ' +
          'with the parameter "userinfo_signed_response_alg".',
      );

      this.logger.error(
        `[${this.constructor.name}] The parameter "userinfo_encrypted_response_alg" must be presented together with the parameter "userinfo_signed_response_alg"`,
        '4aecce7c-ffd6-492d-beaa-cd541eb4c61e',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (this.settings.userinfoKeyWrapAlgorithms?.includes(parameters.userinfo_encrypted_response_alg) !== true) {
      const exc = new InvalidClientMetadataException(
        `Unsupported userinfo_encrypted_response_alg "${parameters.userinfo_encrypted_response_alg}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported userinfo_encrypted_response_alg "${parameters.userinfo_encrypted_response_alg}"`,
        '31fe4838-d338-4570-809b-1de8ebf6f68f',
        { supported_userinfo_encrypted_response_algs: this.settings.userinfoKeyWrapAlgorithms, parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getUserinfoEncryptedResponseContentEncryption()`,
      '57c8aa60-bc6c-4ef3-a222-34731a010e89',
      { parameters },
    );

    if (
      typeof parameters.userinfo_encrypted_response_enc !== 'undefined' &&
      typeof parameters.userinfo_encrypted_response_enc !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "userinfo_encrypted_response_enc".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "userinfo_encrypted_response_enc"`,
        'b41fbf47-630a-418f-973a-c65b64e2d9ee',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (
      typeof parameters.userinfo_encrypted_response_enc !== 'undefined' &&
      typeof parameters.userinfo_encrypted_response_alg === 'undefined'
    ) {
      const exc = new InvalidClientMetadataException(
        'The parameter "userinfo_encrypted_response_enc" must be presented together ' +
          'with the parameter "userinfo_encrypted_response_alg".',
      );

      this.logger.error(
        `[${this.constructor.name}] The parameter "userinfo_encrypted_response_enc" must be presented together with the parameter "userinfo_encrypted_response_alg"`,
        '680cd2bd-ed8a-4570-b4e9-8bf82429d4ec',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (
      typeof parameters.userinfo_encrypted_response_enc !== 'undefined' &&
      this.settings.userinfoContentEncryptionAlgorithms?.includes(parameters.userinfo_encrypted_response_enc) !== true
    ) {
      const exc = new InvalidClientMetadataException(
        `Unsupported userinfo_encrypted_response_enc "${parameters.userinfo_encrypted_response_enc}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported userinfo_encrypted_response_enc "${parameters.userinfo_encrypted_response_enc}"`,
        '369b6978-b0a4-424d-9d1b-c3c3b282699b',
        { supported_userinfo_encrypted_response_encs: this.settings.userinfoContentEncryptionAlgorithms, parameters },
        exc,
      );

      throw exc;
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
   * Returns the JWT Authorization Response JSON Web Signature Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns JWT Authorization Response JSON Web Signature Algorithm provided by the Client.
   */
  private getAuthorizationSignedResponseAlgorithm(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>> {
    this.logger.debug(
      `[${this.constructor.name}] Called getAuthorizationSignedResponseAlgorithm()`,
      '7d66a814-ac47-42a4-981c-4f3499a1f482',
      { parameters },
    );

    if (
      typeof parameters.authorization_signed_response_alg !== 'undefined' &&
      typeof parameters.authorization_signed_response_alg !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "authorization_signed_response_alg".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "authorization_signed_response_alg"`,
        'f84f1f30-82a1-4b51-b972-2dd1caf854ab',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.authorization_signed_response_alg === 'undefined') {
      return null;
    }

    if (
      this.settings.authorizationSignatureAlgorithms?.includes(parameters.authorization_signed_response_alg) !== true
    ) {
      const exc = new InvalidClientMetadataException(
        `Unsupported authorization_signed_response_alg "${parameters.authorization_signed_response_alg}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported authorization_signed_response_alg "${parameters.authorization_signed_response_alg}"`,
        '05c66b17-838f-4518-a2f7-1d46d9140303',
        { supported_authorization_signed_response_algs: this.settings.authorizationSignatureAlgorithms, parameters },
        exc,
      );

      throw exc;
    }

    return parameters.authorization_signed_response_alg;
  }

  /**
   * Returns the JWT Authorization Response JSON Web Encryption Key Wrap Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns JWT Authorization Response JSON Web Encryption Key Wrap Algorithm provided by the Client.
   */
  private getAuthorizationEncryptedResponseKeyWrap(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<JsonWebEncryptionKeyWrapAlgorithm> {
    this.logger.debug(
      `[${this.constructor.name}] Called getAuthorizationEncryptedResponseKeyWrap()`,
      'bc6fca69-154d-4649-9968-2aef65de22fe',
      { parameters },
    );

    if (
      typeof parameters.authorization_encrypted_response_alg !== 'undefined' &&
      typeof parameters.authorization_encrypted_response_alg !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "authorization_encrypted_response_alg".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "authorization_encrypted_response_alg"`,
        '95424658-5d51-438d-ab1d-37a4850de158',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.authorization_encrypted_response_alg === 'undefined') {
      return null;
    }

    if (typeof parameters.authorization_signed_response_alg === 'undefined') {
      const exc = new InvalidClientMetadataException(
        'The parameter "authorization_encrypted_response_alg" must be presented together ' +
          'with the parameter "authorization_signed_response_alg".',
      );

      this.logger.error(
        `[${this.constructor.name}] The parameter "authorization_encrypted_response_alg" must be presented together with the parameter "authorization_signed_response_alg"`,
        'd75fccdf-abae-4fe8-9428-fa1737c22c33',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (
      this.settings.authorizationKeyWrapAlgorithms?.includes(parameters.authorization_encrypted_response_alg) !== true
    ) {
      const exc = new InvalidClientMetadataException(
        `Unsupported authorization_encrypted_response_alg "${parameters.authorization_encrypted_response_alg}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported authorization_encrypted_response_alg "${parameters.authorization_encrypted_response_alg}"`,
        '43d2e35f-51ee-4ab5-978a-28bac85191e5',
        { supported_authorization_encrypted_response_algs: this.settings.authorizationKeyWrapAlgorithms, parameters },
        exc,
      );

      throw exc;
    }

    return parameters.authorization_encrypted_response_alg;
  }

  /**
   * Returns the JWT Authorization Response JSON Web Encryption Content Encryption Algorithm provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns JWT Authorization Response JSON Web Encryption Content Encryption Algorithm provided by the Client.
   */
  private getAuthorizationEncryptedResponseContentEncryption(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<JsonWebEncryptionContentEncryptionAlgorithm> {
    this.logger.debug(
      `[${this.constructor.name}] Called getAuthorizationEncryptedResponseContentEncryption()`,
      '9de16487-bec4-4d99-a005-3e8d4372deab',
      { parameters },
    );

    if (
      typeof parameters.authorization_encrypted_response_enc !== 'undefined' &&
      typeof parameters.authorization_encrypted_response_enc !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "authorization_encrypted_response_enc".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "authorization_encrypted_response_enc"`,
        '99fdbeb8-d036-4570-b421-17e8cede28bd',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (
      typeof parameters.authorization_encrypted_response_enc !== 'undefined' &&
      typeof parameters.authorization_encrypted_response_alg === 'undefined'
    ) {
      const exc = new InvalidClientMetadataException(
        'The parameter "authorization_encrypted_response_enc" must be presented together ' +
          'with the parameter "authorization_encrypted_response_alg".',
      );

      this.logger.error(
        `[${this.constructor.name}] The parameter "authorization_encrypted_response_enc" must be presented together with the parameter "authorization_encrypted_response_alg"`,
        'd4d993ee-8b14-4d2b-a088-87cc51ab3d52',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (
      typeof parameters.authorization_encrypted_response_enc !== 'undefined' &&
      this.settings.authorizationContentEncryptionAlgorithms?.includes(
        parameters.authorization_encrypted_response_enc,
      ) !== true
    ) {
      const exc = new InvalidClientMetadataException(
        `Unsupported authorization_encrypted_response_enc "${parameters.authorization_encrypted_response_enc}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported authorization_encrypted_response_enc "${parameters.authorization_encrypted_response_enc}"`,
        '397c7b11-e937-40f2-908d-cfad1dacfe7b',
        {
          supported_authorization_encrypted_response_encs: this.settings.authorizationContentEncryptionAlgorithms,
          parameters,
        },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.authorization_encrypted_response_enc === 'string') {
      return parameters.authorization_encrypted_response_enc;
    }

    return typeof parameters.authorization_encrypted_response_alg === 'string' ? 'A128CBC-HS256' : null;
  }

  /**
   * Returns the Client Authentication Method provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Client Authentication Method provided by the Client.
   */
  private getAuthenticationMethod(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): ClientAuthentication {
    this.logger.debug(
      `[${this.constructor.name}] Called getAuthenticationMethod()`,
      '4a442cb8-8519-4393-91ce-103a461b47d8',
      { parameters },
    );

    if (
      typeof parameters.token_endpoint_auth_method !== 'undefined' &&
      typeof parameters.token_endpoint_auth_method !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "token_endpoint_auth_method".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "token_endpoint_auth_method"`,
        'ab1327a3-0b56-4d20-b1da-f93f489cc7d4',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.token_endpoint_auth_method === 'undefined') {
      return 'client_secret_basic';
    }

    if (!this.settings.clientAuthenticationMethods.includes(parameters.token_endpoint_auth_method)) {
      const exc = new InvalidClientMetadataException(
        `Unsupported token_endpoint_auth_method "${parameters.token_endpoint_auth_method}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported token_endpoint_auth_method "${parameters.token_endpoint_auth_method}"`,
        'c232ea78-2dc6-4cab-86c1-2305c97e3b88',
        { supported_token_endpoint_auth_methods: this.settings.clientAuthenticationMethods, parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getAuthenticationSigningAlgorithm()`,
      'dd019b04-f6db-40bf-bb10-127daf9019d4',
      { parameters },
    );

    if (
      typeof parameters.token_endpoint_auth_signing_alg !== 'undefined' &&
      typeof parameters.token_endpoint_auth_signing_alg !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "token_endpoint_auth_signing_alg".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "token_endpoint_auth_signing_alg"`,
        '06bb2579-c714-48b1-9a80-0d7b3f9e94f5',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (
      typeof parameters.token_endpoint_auth_signing_alg !== 'undefined' &&
      !this.settings.clientAuthenticationSignatureAlgorithms.includes(parameters.token_endpoint_auth_signing_alg)
    ) {
      const exc = new InvalidClientMetadataException(
        `Unsupported token_endpoint_auth_signing_alg "${parameters.token_endpoint_auth_signing_alg}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Unsupported token_endpoint_auth_signing_alg "${parameters.token_endpoint_auth_signing_alg}"`,
        '35092450-b7bb-4573-8d9e-b0306c33f2c0',
        {
          supported_token_endpoint_auth_signing_algs: this.settings.clientAuthenticationSignatureAlgorithms,
          parameters,
        },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called checkAuthenticationMethodAndAuthenticationMethodSignature()`,
      'f4bbae1d-f9e3-46db-856a-788ce3d1b645',
      { parameters },
    );

    const {
      token_endpoint_auth_method: authenticationMethod,
      token_endpoint_auth_signing_alg: authenticationSigningAlgorithm,
    } = parameters;

    if (authenticationMethod !== 'client_secret_jwt' && authenticationMethod !== 'private_key_jwt') {
      if (typeof authenticationSigningAlgorithm === 'undefined') {
        return;
      }

      const exc = new InvalidClientMetadataException(
        `The Client Authentication Method "${authenticationMethod}" ` +
          'does not require a Client Authentication Signing Algorithm.',
      );

      this.logger.error(
        `[${this.constructor.name}] The Client Authentication Method "${authenticationMethod}" does not require a Client Authentication Signing Algorithm`,
        '00462dfd-a99a-4425-81d6-954e84e3ebbf',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof authenticationSigningAlgorithm === 'undefined') {
      const exc = new InvalidClientMetadataException(
        'Missing required parameter "token_endpoint_auth_signing_alg" ' +
          `for Client Authentication Method "${authenticationMethod}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Missing required parameter "token_endpoint_auth_signing_alg" for Client Authentication Method "${authenticationMethod}"`,
        '1460f6f9-4280-41c6-b1b3-f5fb022b4136',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.jwks === 'undefined' && typeof parameters.jwks_uri === 'undefined') {
      const exc = new InvalidClientMetadataException(
        'One of the parameters "jwks_uri" or "jwks" must be provided ' +
          `for Client Authentication Method "${authenticationMethod}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] One of the parameters "jwks_uri" or "jwks" must be provided for Client Authentication Method "${authenticationMethod}"`,
        '4b9f6cf2-828e-4eb0-9959-12a7fa1eee47',
        { parameters },
        exc,
      );

      throw exc;
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
      const exc = new InvalidClientMetadataException(
        `Invalid JSON Web Signature Algorithm "${authenticationSigningAlgorithm}" ` +
          `for Client Authentication Method "${authenticationMethod}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Invalid JSON Web Signature Algorithm "${authenticationSigningAlgorithm}" for Client Authentication Method "${authenticationMethod}"`,
        'd5ad001f-2473-43dd-9be0-e7d86ca31e32',
        { parameters },
        exc,
      );

      throw exc;
    }
  }

  /**
   * Returns the Default Max Age provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Default Max Age provided by the Client.
   */
  private getDefaultMaxAge(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<number> {
    this.logger.debug(`[${this.constructor.name}] Called getDefaultMaxAge()`, '8cc52901-1222-44a5-a332-68924fcc179d', {
      parameters,
    });

    if (typeof parameters.default_max_age === 'undefined') {
      return null;
    }

    if (typeof parameters.default_max_age !== 'number') {
      const exc = new InvalidClientMetadataException('Invalid parameter "default_max_age".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "default_max_age"`,
        '8d1cb44d-0a35-4080-b562-8dce62879f8b',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (!Number.isInteger(parameters.default_max_age) || parameters.default_max_age <= 0) {
      const exc = new InvalidClientMetadataException('The default max age must be a positive integer.');

      this.logger.error(
        `[${this.constructor.name}] The default max age must be a positive integer`,
        'b9ff2e1a-7f9f-4cb1-a007-a1f29af4bfe3',
        { parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getRequireAuthTime()`,
      'fdbdfd83-2a8f-450f-b0c5-9184b3cb213b',
      { parameters },
    );

    if (typeof parameters.require_auth_time !== 'undefined' && typeof parameters.require_auth_time !== 'boolean') {
      const exc = new InvalidClientMetadataException('Invalid parameter "require_auth_time".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "require_auth_time"`,
        '5aa9ba43-0ebd-4c43-b88f-2d889735076c',
        { parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getDefaultAcrValues()`,
      '4ce0b496-cc79-4690-85ff-8d271ae732a1',
      { parameters },
    );

    if (
      typeof parameters.default_acr_values !== 'undefined' &&
      (!Array.isArray(parameters.default_acr_values) ||
        parameters.default_acr_values.some((acrValue) => typeof acrValue !== 'string'))
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "default_acr_values".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "default_acr_values"`,
        'e16c70dd-8bd3-4c4a-90d9-4ec6f188639d',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.default_acr_values === 'undefined') {
      return null;
    }

    return parameters.default_acr_values.map<string>((acrValue) => {
      if (!this.settings.acrValues.includes(acrValue)) {
        const exc = new InvalidClientMetadataException(`Unsupported acr_value "${acrValue}".`);

        this.logger.error(
          `[${this.constructor.name}] Unsupported acr_value "${acrValue}"`,
          'd93071d8-908d-48f0-bba3-6d20757cd509',
          { supported_acr_values: this.settings.acrValues, acr_value: acrValue },
          exc,
        );

        throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getInitiateLoginUri()`,
      'dd144ed0-6971-4a52-9225-42446805d6aa',
      { parameters },
    );

    if (typeof parameters.initiate_login_uri !== 'undefined' && typeof parameters.initiate_login_uri !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "initiate_login_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "initiate_login_uri"`,
        '713d5ab4-2e6e-4e64-a2ac-70eee4f2e30c',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.initiate_login_uri === 'undefined') {
      return null;
    }

    try {
      return new URL(parameters.initiate_login_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException('Invalid Initiate Login URI.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Invalid Initiate Login URI`,
        'b954ea71-ba7e-4c13-b08b-b7b10ff8c99a',
        { parameters },
        exception,
      );

      throw exception;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getPostLogoutRedirectUris()`,
      'eb1d6550-ca10-4b09-b7f1-0b0fad644f82',
      { parameters },
    );

    if (typeof parameters.post_logout_redirect_uris === 'undefined') {
      return null;
    }

    if (
      !Array.isArray(parameters.post_logout_redirect_uris) ||
      parameters.post_logout_redirect_uris.some((postLogoutRedirectUri) => typeof postLogoutRedirectUri !== 'string')
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "post_logout_redirect_uris".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "post_logout_redirect_uris"`,
        '0456a76f-f604-46f2-b39f-b47a615cda90',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.post_logout_redirect_uris.map((postLogoutRedirectUri) => {
      let url: URL;

      try {
        url = new URL(postLogoutRedirectUri);
      } catch (exc: unknown) {
        const exception = new InvalidClientMetadataException(
          `Invalid Post Logout Redirect URI "${postLogoutRedirectUri}".`,
          { cause: exc },
        );

        this.logger.error(
          `[${this.constructor.name}] Invalid Post Logout Redirect URI "${postLogoutRedirectUri}"`,
          '5857db75-c9f4-40ad-8d43-51f32c14078f',
          { post_logout_redirect_uri: postLogoutRedirectUri },
          exception,
        );

        throw exception;
      }

      if (url.hash.length !== 0) {
        const exc = new InvalidClientMetadataException(
          `The Post Logout Redirect URI "${postLogoutRedirectUri}" MUST NOT have a fragment component.`,
        );

        this.logger.error(
          `[${this.constructor.name}] The Post Logout Redirect URI "${postLogoutRedirectUri}" MUST NOT have a fragment component`,
          'de7ec20e-5873-46e3-abbb-932b9af05a93',
          { post_logout_redirect_uri: postLogoutRedirectUri, parameters },
          exc,
        );

        throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called checkApplicationTypeAndPostLogoutRedirectUris()`,
      '2850226b-cc1e-4096-a2ca-b391f4ec8f7d',
      {
        application_type: applicationType,
        post_logout_redirect_uris: postLogoutRedirectUris?.map((postLogoutRedirectUri) => postLogoutRedirectUri.href),
      },
    );

    if (postLogoutRedirectUris === null) {
      return;
    }

    postLogoutRedirectUris.forEach((postLogoutRedirectUri) => {
      switch (applicationType) {
        case 'native': {
          if (postLogoutRedirectUri.protocol.includes('http') && postLogoutRedirectUri.hostname !== 'localhost') {
            const exc = new InvalidClientMetadataException(
              'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
            );

            this.logger.error(
              `[${this.constructor.name}] The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application`,
              'e5039515-2761-49f9-8e74-d8ae69f13018',
              { post_logout_redirect_uri: postLogoutRedirectUri.href },
              exc,
            );

            throw exc;
          }

          break;
        }

        case 'web': {
          if (!postLogoutRedirectUri.protocol.includes('https')) {
            const exc = new InvalidClientMetadataException(
              `The Post Logout Redirect URI "${postLogoutRedirectUri.href}" does not use the https protocol.`,
            );

            this.logger.error(
              `[${this.constructor.name}] The Post Logout Redirect URI "${postLogoutRedirectUri.href}" does not use the https protocol`,
              'efed4087-012f-4326-bdbc-c12c067bf44b',
              { post_logout_redirect_uri: postLogoutRedirectUri.href },
              exc,
            );

            throw exc;
          }

          if (postLogoutRedirectUri.hostname === 'localhost' || postLogoutRedirectUri.hostname === '127.0.0.1') {
            const exc = new InvalidClientMetadataException(
              'The Authorization Server disallows using localhost as a Post Logout Redirect URI for a "web" application.',
            );

            this.logger.error(
              `[${this.constructor.name}] The Authorization Server disallows using localhost as a Post Logout Redirect URI for a "web" application`,
              '5ea1d025-7791-4815-b2e0-77380b7fc359',
              { post_logout_redirect_uri: postLogoutRedirectUri.href },
              exc,
            );

            throw exc;
          }

          break;
        }
      }
    });
  }

  /**
   * Checks if the parameter **backchannel_logout_uri** is provided
   * when **backchannel_logout_session_required** is provided.
   *
   * @param parameters Parameters of the Client Registration Request.
   */
  private checkBackChannelLogoutUriAndBackChannelSessionRequired(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): void {
    this.logger.debug(
      `[${this.constructor.name}] Called checkBackChannelLogoutUriAndBackChannelSessionRequired()`,
      'db26131f-c45c-459a-bbfe-f706fbcbd77c',
      { parameters },
    );

    if (
      typeof parameters.backchannel_logout_session_required !== 'undefined' &&
      typeof parameters.backchannel_logout_uri === 'undefined'
    ) {
      const exc = new InvalidClientMetadataException(
        'The parameter "backchannel_logout_session_required" must be presented together ' +
          'with the parameter "backchannel_logout_uri".',
      );

      this.logger.error(
        `[${this.constructor.name}] The parameter "backchannel_logout_session_required" must be presented together with the parameter "backchannel_logout_uri"`,
        'f9eabd3f-649f-4666-b8dd-061ec64d31d0',
        { parameters },
        exc,
      );

      throw exc;
    }
  }

  /**
   * Returns the Back-Channel Logout Uri provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Back-Channel Logout Uri provided by the Client.
   */
  private getBackChannelLogoutUri(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<URL> {
    this.logger.debug(
      `[${this.constructor.name}] Called getBackChannelLogoutUri()`,
      '83195d90-5793-4efc-986d-c73dd48f1b53',
      { parameters },
    );

    if (
      typeof parameters.backchannel_logout_uri !== 'undefined' &&
      typeof parameters.backchannel_logout_uri !== 'string'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "backchannel_logout_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "backchannel_logout_uri"`,
        '34898b52-b590-4f80-9a48-586901d6577a',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.backchannel_logout_uri === 'undefined') {
      return null;
    }

    if (!this.settings.enableBackChannelLogout) {
      const exc = new InvalidClientMetadataException('The Authorization Server does not support Back-Channel Logout.');

      this.logger.error(
        `[${this.constructor.name}] The Authorization Server does not support Back-Channel Logout`,
        '88084cee-4963-4435-9f77-7ae3c978b18a',
        null,
        exc,
      );

      throw exc;
    }

    let url: URL;

    try {
      url = new URL(parameters.backchannel_logout_uri);
    } catch (exc: unknown) {
      const exception = new InvalidClientMetadataException(
        `Invalid Back-Channel Logout URI "${parameters.backchannel_logout_uri}".`,
        { cause: exc },
      );

      this.logger.error(
        `[${this.constructor.name}] Invalid Back-Channel Logout URI "${parameters.backchannel_logout_uri}"`,
        '6be55e71-9d6c-46a7-be08-d503b061bfd4',
        { parameters },
        exception,
      );

      throw exception;
    }

    if (url.hash.length !== 0) {
      const exc = new InvalidClientMetadataException(
        `The Back-Channel Logout URI "${parameters.backchannel_logout_uri}" MUST NOT have a fragment component.`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Back-Channel Logout URI "${parameters.backchannel_logout_uri}" MUST NOT have a fragment component`,
        'b559d7d8-02f0-4f6f-97a0-38150c367142',
        { parameters },
        exc,
      );

      throw exc;
    }

    return url;
  }

  /**
   * Returns the Back-Channel Logout Uri provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Back-Channel Logout Uri provided by the Client.
   */
  private getBackChannelLogoutSessionRequired(
    parameters: PostRegistrationRequest | PutBodyRegistrationRequest,
  ): Nullable<boolean> {
    this.logger.debug(
      `[${this.constructor.name}] Called getBackChannelLogoutSessionRequired()`,
      '1992ca0e-a840-4118-b40a-7ab43fec3bc9',
      { parameters },
    );

    if (
      typeof parameters.backchannel_logout_session_required !== 'undefined' &&
      typeof parameters.backchannel_logout_session_required !== 'boolean'
    ) {
      const exc = new InvalidClientMetadataException('Invalid parameter "backchannel_logout_session_required".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "backchannel_logout_session_required"`,
        'b3d5fb70-4009-4685-ab1a-4d074023aeaf',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.backchannel_logout_session_required === 'undefined') {
      return typeof parameters.backchannel_logout_uri !== 'undefined' ? false : null;
    }

    if (parameters.backchannel_logout_session_required && !this.settings.includeSessionIdInLogoutToken) {
      const exc = new InvalidClientMetadataException(
        'The Authorization Server does not support passing the claim "sid" in the Logout Token.',
      );

      this.logger.error(
        `[${this.constructor.name}] The Authorization Server does not support passing the claim "sid" in the Logout Token`,
        '11f7a161-8c52-4b2c-bd81-a193c7954b3e',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.backchannel_logout_session_required;
  }

  /**
   * Checks if the Back-Channel Logout URI provided by the Client matches the requirements of the requested Application Type.
   *
   * @param applicationType Application Type requested by the Client.
   * @param backChannelLogoutUri Back-Channel Logout URI provided by the Client.
   */
  private checkApplicationTypeAndBackChannelLogoutUri(
    applicationType: ApplicationType,
    backChannelLogoutUri: Nullable<URL>,
  ): void {
    this.logger.debug(
      `[${this.constructor.name}] Called checkApplicationTypeAndBackChannelLogoutUri()`,
      '0910afe8-4824-4b09-b8b3-22d3bf2e859a',
      { application_type: applicationType, back_channel_logout_uri: backChannelLogoutUri?.href },
    );

    if (backChannelLogoutUri === null) {
      return;
    }

    switch (applicationType) {
      case 'native': {
        if (backChannelLogoutUri.protocol.includes('http') && backChannelLogoutUri.hostname !== 'localhost') {
          const exc = new InvalidClientMetadataException(
            'The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application.',
          );

          this.logger.error(
            `[${this.constructor.name}] The Authorization Server disallows using the http or https protocol - except for localhost - for a "native" application`,
            '6d91d167-ca8a-4543-a3cb-dcc90f67df22',
            { back_channel_logout_uri: backChannelLogoutUri.href },
            exc,
          );

          throw exc;
        }

        break;
      }

      case 'web': {
        if (!backChannelLogoutUri.protocol.includes('https')) {
          const exc = new InvalidClientMetadataException(
            `The Back-Channel Logout URI "${backChannelLogoutUri.href}" does not use the https protocol.`,
          );

          this.logger.error(
            `[${this.constructor.name}] The Back-Channel Logout URI "${backChannelLogoutUri.href}" does not use the https protocol`,
            'bec50627-6bd2-49b1-8450-e602e80efc4a',
            { back_channel_logout_uri: backChannelLogoutUri.href },
            exc,
          );

          throw exc;
        }

        if (backChannelLogoutUri.hostname === 'localhost' || backChannelLogoutUri.hostname === '127.0.0.1') {
          const exc = new InvalidClientMetadataException(
            'The Authorization Server disallows using localhost as a Back-Channel Logout URI for a "web" application.',
          );

          this.logger.error(
            `[${this.constructor.name}] The Authorization Server disallows using localhost as a Back-Channel Logout URI for a "web" application`,
            '7c0ae1b2-a7a3-4fb4-b3a6-5abef9555459',
            { back_channel_logout_uri: backChannelLogoutUri.href },
            exc,
          );

          throw exc;
        }

        break;
      }
    }
  }

  /**
   * Returns the Software Identifier provided by the Client.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Software Identifier provided by the Client.
   */
  private getSoftwareId(parameters: PostRegistrationRequest | PutBodyRegistrationRequest): Nullable<string> {
    this.logger.debug(`[${this.constructor.name}] Called getSoftwareId()`, '4648301e-4db4-4322-ba3b-18291aee7aeb', {
      parameters,
    });

    if (typeof parameters.software_id !== 'undefined' && typeof parameters.software_id !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "software_id".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "software_id"`,
        'fbdff4d5-262d-460a-bfe5-406bfc477fc6',
        { parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getSoftwareVersion()`,
      '55fb4dd7-7902-4990-ac2b-6524f650e314',
      { parameters },
    );

    if (typeof parameters.software_version !== 'undefined' && typeof parameters.software_version !== 'string') {
      const exc = new InvalidClientMetadataException('Invalid parameter "software_version".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "software_version"`,
        'd0183c01-985b-4b6e-a3c1-e9a25551d461',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.software_version ?? null;
  }
}
