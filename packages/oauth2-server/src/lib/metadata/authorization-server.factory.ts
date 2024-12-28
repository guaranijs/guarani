import { DependencyInjectionContainer, getContainer } from '@guarani/di';
import { JsonWebKeySet } from '@guarani/jose';
import { Constructor } from '@guarani/types';

import { AuthorizationServer } from '../authorization-server';
import { ClientAuthenticationInterface } from '../client-authentication/client-authentication.interface';
import { clientAuthenticationRegistry } from '../client-authentication/client-authentication.registry';
import { CLIENT_AUTHENTICATION } from '../client-authentication/client-authentication.token';
import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { ClientAuthorizationInterface } from '../client-authorization/client-authorization.interface';
import { clientAuthorizationRegistry } from '../client-authorization/client-authorization.registry';
import { CLIENT_AUTHORIZATION } from '../client-authorization/client-authorization.token';
import { DisplayInterface } from '../displays/display.interface';
import { displayRegistry } from '../displays/display.registry';
import { DISPLAY } from '../displays/display.token';
import { Display } from '../displays/display.type';
import { AuthorizationEndpoint } from '../endpoints/authorization.endpoint';
import { DeviceAuthorizationEndpoint } from '../endpoints/device-authorization.endpoint';
import { DiscoveryEndpoint } from '../endpoints/discovery.endpoint';
import { EndSessionEndpoint } from '../endpoints/end-session.endpoint';
import { EndpointInterface } from '../endpoints/endpoint.interface';
import { ENDPOINT } from '../endpoints/endpoint.token';
import { InteractionEndpoint } from '../endpoints/interaction.endpoint';
import { IntrospectionEndpoint } from '../endpoints/introspection.endpoint';
import { JsonWebKeySetEndpoint } from '../endpoints/jsonwebkeyset.endpoint';
import { RegistrationEndpoint } from '../endpoints/registration.endpoint';
import { RevocationEndpoint } from '../endpoints/revocation.endpoint';
import { TokenEndpoint } from '../endpoints/token.endpoint';
import { UserinfoEndpoint } from '../endpoints/userinfo.endpoint';
import { GrantTypeInterface } from '../grant-types/grant-type.interface';
import { grantTypeRegistry } from '../grant-types/grant-type.registry';
import { GRANT_TYPE } from '../grant-types/grant-type.token';
import { GrantType } from '../grant-types/grant-type.type';
import { AuthHandler } from '../handlers/auth.handler';
import { AuthorizationResponseTokenHandler } from '../handlers/authorization-response-token.handler';
import { ClaimsHandler } from '../handlers/claims.handler';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { ClientAuthorizationHandler } from '../handlers/client-authorization.handler';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { LogoutHandler } from '../handlers/logout.handler';
import { LogoutTokenHandler } from '../handlers/logout-token.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { InteractionTypeInterface } from '../interaction-types/interaction-type.interface';
import { interactionTypeRegistry } from '../interaction-types/interaction-type.registry';
import { INTERACTION_TYPE } from '../interaction-types/interaction-type.token';
import { ConsoleLogger } from '../logger/console.logger';
import { Logger } from '../logger/logger';
import { LogoutTypeInterface } from '../logout-types/logout-type.interface';
import { logoutTypeRegistry } from '../logout-types/logout-type.registry';
import { LOGOUT_TYPE } from '../logout-types/logout-type.token';
import { PkceInterface } from '../pkces/pkce.interface';
import { pkceRegistry } from '../pkces/pkce.registry';
import { PKCE } from '../pkces/pkce.token';
import { Pkce } from '../pkces/pkce.type';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { responseModeRegistry } from '../response-modes/response-mode.registry';
import { RESPONSE_MODE } from '../response-modes/response-mode.token';
import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseTypeInterface } from '../response-types/response-type.interface';
import { responseTypeRegistry } from '../response-types/response-type.registry';
import { RESPONSE_TYPE } from '../response-types/response-type.token';
import { ResponseType } from '../response-types/response-type.type';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { AccessTokenService } from '../services/default/access-token.service';
import { AuthorizationCodeService } from '../services/default/authorization-code.service';
import { ClientService } from '../services/default/client.service';
import { ConsentService } from '../services/default/consent.service';
import { DeviceCodeService } from '../services/default/device-code.service';
import { GrantService } from '../services/default/grant.service';
import { LoginService } from '../services/default/login.service';
import { LogoutTicketService } from '../services/default/logout-ticket.service';
import { RefreshTokenService } from '../services/default/refresh-token.service';
import { SessionService } from '../services/default/session.service';
import { UserService } from '../services/default/user.service';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { LogoutTicketServiceInterface } from '../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../services/logout-ticket.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { AuthorizationRequestValidator } from '../validators/authorization/authorization-request.validator';
import { authorizationRequestValidatorsRegistry } from '../validators/authorization/authorization-request.validator.registry';
import { DeviceAuthorizationRequestValidator } from '../validators/device-authorization-request.validator';
import { EndSessionRequestValidator } from '../validators/end-session-request.validator';
import { InteractionRequestValidator } from '../validators/interaction/interaction-request.validator';
import { interactionRequestValidatorsRegistry } from '../validators/interaction/interaction-request.validator.registry';
import { IntrospectionRequestValidator } from '../validators/introspection-request.validator';
import { RegistrationRequestValidator } from '../validators/registration/registration-request.validator';
import { registrationRequestValidatorsRegistry } from '../validators/registration/registration-request.validator.registry';
import { RevocationRequestValidator } from '../validators/revocation-request.validator';
import { TokenRequestValidator } from '../validators/token/token-request.validator';
import { tokenRequestValidatorsRegistry } from '../validators/token/token-request.validator.registry';
import { AuthorizationServerOptions } from './authorization-server.options';

/**
 * Factory class for configuring and instantiating an OAuth 2.0 Authorization Server.
 */
export class AuthorizationServerFactory {
  /**
   * Dependency Injection Container of the OAuth 2.0 Authorization Server.
   */
  private static readonly container = getContainer('oauth2');

  /**
   * Authorization Server Options for usage in the factory.
   */
  private static readonly authorizationServerOptions: AuthorizationServerOptions;

  /**
   * Settings of the Authorization Server.
   */
  private static readonly settings: Settings;

  /**
   * Fabricates a new instance of the provided OAuth 2.0 Authorization Server.
   *
   * @param server Authorization Server Constructor.
   * @returns Instance of the provided Authorization Server.
   */
  public static async create<T extends AuthorizationServer>(
    server: Constructor<T>,
    options: AuthorizationServerOptions,
  ): Promise<T> {
    Reflect.set(this, 'authorizationServerOptions', options);

    await this.configure();

    this.container.bind(AuthorizationServer).toClass(server).asSingleton();
    this.container.bind(DependencyInjectionContainer).toValue(this.container);

    return <T>this.container.resolve(AuthorizationServer);
  }

  /**
   * Bootstraps the Configuration of the OAuth 2.0 Authorization Server.
   */
  private static async configure(): Promise<void> {
    await this.setAuthorizationServerSettings();
    this.setClientAuthentication();
    this.setClientAuthorization();
    this.setGrantTypes();
    this.setDisplays();
    this.setInteractionTypes();
    this.setLogoutTypes();
    this.setResponseTypes();
    this.setResponseModes();
    this.setPkces();
    this.setJsonWebKeySet();
    this.setEndpoints();
    this.setHandlers();
    this.setValidators();
    this.setLogger();
    this.setAccessTokenService();
    this.setAuthorizationCodeService();
    this.setClientService();
    this.setConsentService();
    this.setDeviceCodeService();
    this.setSessionService();
    this.setGrantService();
    this.setRefreshTokenService();
    this.setLoginService();
    this.setLogoutTicketService();
    this.setUserService();
  }

  /**
   * Defines the Settings of the Authorization Server.
   */
  private static async setAuthorizationServerSettings(): Promise<void> {
    const settings: Settings = {
      issuer: <string>this.authorizationServerOptions.issuer,
      scopes: <string[]>this.authorizationServerOptions.scopes,
      clientAuthenticationMethods:
        this.authorizationServerOptions.clientAuthenticationMethods ??
        <ClientAuthentication[]>Object.keys(clientAuthenticationRegistry),
      grantTypes: this.authorizationServerOptions.grantTypes ?? <GrantType[]>Object.keys(grantTypeRegistry),
      responseTypes: this.authorizationServerOptions.responseTypes ?? <ResponseType[]>Object.keys(responseTypeRegistry),
      responseModes: this.authorizationServerOptions.responseModes ?? <ResponseMode[]>Object.keys(responseModeRegistry),
      pkces: this.authorizationServerOptions.pkces ?? <Pkce[]>Object.keys(pkceRegistry),
      displays: <Display[]>Object.keys(displayRegistry),
      acrValues: this.authorizationServerOptions.acrValues ?? [],
      uiLocales: this.authorizationServerOptions.uiLocales ?? [],
      subjectTypes: this.authorizationServerOptions.subjectTypes ?? ['public'],
      clientAuthenticationSignatureAlgorithms:
        this.authorizationServerOptions.clientAuthenticationSignatureAlgorithms ?? [],
      idTokenSignatureAlgorithms: this.authorizationServerOptions.idTokenSignatureAlgorithms ?? ['RS256'],
      idTokenKeyWrapAlgorithms: this.authorizationServerOptions.idTokenKeyWrapAlgorithms,
      idTokenContentEncryptionAlgorithms: this.authorizationServerOptions.idTokenContentEncryptionAlgorithms,
      userinfoSignatureAlgorithms: this.authorizationServerOptions.userinfoSignatureAlgorithms,
      userinfoKeyWrapAlgorithms: this.authorizationServerOptions.userinfoKeyWrapAlgorithms,
      userinfoContentEncryptionAlgorithms: this.authorizationServerOptions.userinfoContentEncryptionAlgorithms,
      authorizationSignatureAlgorithms: this.authorizationServerOptions.authorizationSignatureAlgorithms,
      authorizationKeyWrapAlgorithms: this.authorizationServerOptions.authorizationKeyWrapAlgorithms,
      authorizationContentEncryptionAlgorithms:
        this.authorizationServerOptions.authorizationContentEncryptionAlgorithms,
      jwks:
        typeof this.authorizationServerOptions.jwks !== 'undefined'
          ? await JsonWebKeySet.load(this.authorizationServerOptions.jwks)
          : undefined,
      userInteraction: this.authorizationServerOptions.userInteraction,
      enableRefreshTokenRotation: this.authorizationServerOptions.enableRefreshTokenRotation ?? false,
      enableRefreshTokenRevocation: this.authorizationServerOptions.enableRefreshTokenRevocation ?? true,
      enableRefreshTokenIntrospection: this.authorizationServerOptions.enableRefreshTokenIntrospection ?? false,
      enableBackChannelLogout: this.authorizationServerOptions.enableBackChannelLogout ?? false,
      includeSessionIdInLogoutToken: this.authorizationServerOptions.includeSessionIdInLogoutToken ?? false,
      devicePollingInterval: this.authorizationServerOptions.devicePollingInterval ?? 5,
      enableAuthorizationResponseIssuerIdentifier:
        this.authorizationServerOptions.enableAuthorizationResponseIssuerIdentifier ?? false,
      enableClaimsAuthorizationRequestParameter:
        this.authorizationServerOptions.enableClaimsAuthorizationRequestParameter ?? true,
      postLogoutUrl: this.authorizationServerOptions.postLogoutUrl,
      secretKey: this.authorizationServerOptions.secretKey,
      maxLocalSubjectLength: this.authorizationServerOptions.maxLocalSubjectLength,
    };

    this.container.bind<Settings>(SETTINGS).toValue(settings);

    Reflect.set(this, 'settings', settings);
  }

  /**
   * Defines the Client Authentication Methods supported by the Authorization Server.
   */
  private static setClientAuthentication(): void {
    const { clientAuthenticationMethods } = this.settings;

    if (clientAuthenticationMethods.length === 0) {
      return;
    }

    clientAuthenticationMethods.forEach((clientAuthenticationMethod) => {
      const constructor = clientAuthenticationRegistry[clientAuthenticationMethod];
      this.container.bind<ClientAuthenticationInterface>(CLIENT_AUTHENTICATION).toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the Client Authorization Methods supported by the Authorization Server.
   */
  private static setClientAuthorization(): void {
    Object.values(clientAuthorizationRegistry).forEach((clientAuthorization) => {
      this.container
        .bind<ClientAuthorizationInterface>(CLIENT_AUTHORIZATION)
        .toClass(clientAuthorization)
        .asSingleton();
    });
  }

  /**
   * Defines the Grant Types supported by the Authorization Server.
   */
  private static setGrantTypes(): void {
    const { grantTypes } = this.settings;

    if (grantTypes.length === 0) {
      return;
    }

    grantTypes.forEach((grantType) => {
      const constructor = grantTypeRegistry[grantType];
      this.container.bind<GrantTypeInterface>(GRANT_TYPE).toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the Displays supported by the Authorization Server.
   */
  private static setDisplays(): void {
    Object.values(displayRegistry).forEach((display) => {
      this.container.bind<DisplayInterface>(DISPLAY).toClass(display).asSingleton();
    });
  }

  /**
   * Defines the Interaction Types supported by the Authorization Server.
   */
  private static setInteractionTypes(): void {
    Object.values(interactionTypeRegistry).forEach((interactionType) => {
      this.container.bind<InteractionTypeInterface>(INTERACTION_TYPE).toClass(interactionType).asSingleton();
    });
  }

  /**
   * Defines the Logout Types supported by the Authorization Server.
   */
  private static setLogoutTypes(): void {
    Object.values(logoutTypeRegistry).forEach((logoutType) => {
      this.container.bind<LogoutTypeInterface>(LOGOUT_TYPE).toClass(logoutType).asSingleton();
    });
  }

  /**
   * Defines the Response Types supported by the Authorization Server.
   */
  private static setResponseTypes(): void {
    const { responseTypes } = this.settings;

    if (responseTypes.length === 0) {
      return;
    }

    responseTypes.forEach((responseType) => {
      const constructor = responseTypeRegistry[responseType];
      this.container.bind<ResponseTypeInterface>(RESPONSE_TYPE).toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the Response Modes supported by the Authorization Server.
   */
  private static setResponseModes(): void {
    const { responseModes } = this.settings;

    if (responseModes.length === 0) {
      return;
    }

    responseModes.forEach((responseMode) => {
      const constructor = responseModeRegistry[responseMode];
      this.container.bind<ResponseModeInterface>(RESPONSE_MODE).toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the PKCE Methods supported by the Authorization Server.
   */
  private static setPkces(): void {
    const { pkces } = this.settings;

    if (pkces.length === 0) {
      return;
    }

    pkces.forEach((pkce) => {
      const constructor = pkceRegistry[pkce];
      this.container.bind<PkceInterface>(PKCE).toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the JSON Web Key Set of the Authorization Server.
   */
  private static setJsonWebKeySet(): void {
    const { jwks } = this.settings;

    if (typeof jwks === 'undefined') {
      return;
    }

    this.container.bind(JsonWebKeySet).toValue(jwks);
  }

  /**
   * Defines the Endpoints supported by the Authorization Server.
   */
  private static setEndpoints(): void {
    const hasAuthorizationEndpoint = this.container.isRegistered<ResponseTypeInterface>(RESPONSE_TYPE);
    const hasTokenEndpoint = this.container.isRegistered<GrantTypeInterface>(GRANT_TYPE);

    if (!hasAuthorizationEndpoint && !hasTokenEndpoint) {
      throw new Error('Cannot instantiate an Authorization Server without Grants.');
    }

    if (hasAuthorizationEndpoint) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(AuthorizationEndpoint).asSingleton();
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(InteractionEndpoint).asSingleton();
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(EndSessionEndpoint).asSingleton();
    }

    if (hasTokenEndpoint) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(TokenEndpoint).asSingleton();
    }

    if (this.authorizationServerOptions.enableRevocationEndpoint !== false) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(RevocationEndpoint).asSingleton();
    }

    if (this.authorizationServerOptions.enableIntrospectionEndpoint !== false) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(IntrospectionEndpoint).asSingleton();
    }

    if (this.authorizationServerOptions.enableRegistrationEndpoint === true) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(RegistrationEndpoint).asSingleton();
    }

    if (this.settings.jwks instanceof JsonWebKeySet) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(JsonWebKeySetEndpoint).asSingleton();
    }

    if (this.settings.grantTypes.includes('urn:ietf:params:oauth:grant-type:device_code')) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(DeviceAuthorizationEndpoint).asSingleton();
    }

    if (this.settings.scopes.includes('openid')) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(UserinfoEndpoint).asSingleton();
    }

    this.container.bind<EndpointInterface>(ENDPOINT).toClass(DiscoveryEndpoint).asSingleton();
  }

  /**
   * Defines the Handlers of the Authorization Server.
   */
  private static setHandlers(): void {
    this.container.bind(ClientAuthenticationHandler).toSelf().asSingleton();
    this.container.bind(ScopeHandler).toSelf().asSingleton();
    this.container.bind(AuthHandler).toSelf().asSingleton();
    this.container.bind(LogoutHandler).toSelf().asSingleton();
    this.container.bind(LogoutTokenHandler).toSelf().asSingleton();
    this.container.bind(AuthorizationResponseTokenHandler).toSelf().asSingleton();

    if (this.settings.scopes.includes('openid')) {
      this.container.bind(IdTokenHandler).toSelf().asSingleton();
      this.container.bind(ClientAuthorizationHandler).toSelf().asSingleton();
      this.container.bind(ClaimsHandler).toSelf().asSingleton();
    }
  }

  /**
   * Defines the Validators of the Authorization Server.
   */
  private static setValidators(): void {
    if (this.authorizationServerOptions.enableIntrospectionEndpoint !== false) {
      this.container.bind(IntrospectionRequestValidator).toSelf().asSingleton();
    }

    if (this.authorizationServerOptions.enableRevocationEndpoint !== false) {
      this.container.bind(RevocationRequestValidator).toSelf().asSingleton();
    }

    if (this.authorizationServerOptions.enableRegistrationEndpoint === true) {
      Object.values(registrationRequestValidatorsRegistry).forEach((validator) => {
        this.container.bind(RegistrationRequestValidator).toClass(validator).asSingleton();
      });
    }

    if (this.settings.grantTypes.includes('urn:ietf:params:oauth:grant-type:device_code')) {
      this.container.bind(DeviceAuthorizationRequestValidator).toSelf().asSingleton();
    }

    if (this.container.isRegistered<ResponseTypeInterface>(RESPONSE_TYPE)) {
      Object.entries(authorizationRequestValidatorsRegistry)
        .filter(([name]) => this.settings.responseTypes.includes(<ResponseType>name))
        .map(([, validator]) => validator)
        .forEach((validator) => this.container.bind(AuthorizationRequestValidator).toClass(validator).asSingleton());

      Object.entries(interactionRequestValidatorsRegistry)
        .map(([, validator]) => validator)
        .forEach((validator) => this.container.bind(InteractionRequestValidator).toClass(validator).asSingleton());

      this.container.bind(EndSessionRequestValidator).toSelf().asSingleton();
    }

    if (this.container.isRegistered<GrantServiceInterface>(GRANT_TYPE)) {
      Object.entries(tokenRequestValidatorsRegistry)
        .filter(([name]) => this.settings.grantTypes.includes(<GrantType>name))
        .map(([, validator]) => validator)
        .forEach((validator) => this.container.bind(TokenRequestValidator).toClass(validator).asSingleton());
    }
  }

  /**
   * Defines the Logger of the Authorization Server.
   */
  private static setLogger(): void {
    const logger = this.authorizationServerOptions.logger ?? ConsoleLogger;

    const binding = this.container.bind(Logger);

    typeof logger === 'function' ? binding.toClass(logger).asSingleton() : binding.toValue(logger);
  }

  /**
   * Defines the Access Token Service used by the Authorization Server.
   */
  private static setAccessTokenService(): void {
    const accessTokenService = this.authorizationServerOptions.accessTokenService ?? AccessTokenService;

    const binding = this.container.bind<AccessTokenServiceInterface>(ACCESS_TOKEN_SERVICE);

    typeof accessTokenService === 'function'
      ? binding.toClass(accessTokenService).asSingleton()
      : binding.toValue(accessTokenService);
  }

  /**
   * Defines the Authorization Code Service used by the Authorization Server.
   */
  private static setAuthorizationCodeService(): void {
    if (!this.settings.grantTypes.includes('authorization_code')) {
      return;
    }

    const authorizationCodeService =
      this.authorizationServerOptions.authorizationCodeService ?? AuthorizationCodeService;

    const binding = this.container.bind<AuthorizationCodeServiceInterface>(AUTHORIZATION_CODE_SERVICE);

    typeof authorizationCodeService === 'function'
      ? binding.toClass(authorizationCodeService).asSingleton()
      : binding.toValue(authorizationCodeService);
  }

  /**
   * Defines the Client Service used by the Authorization Server.
   */
  private static setClientService(): void {
    const clientService = this.authorizationServerOptions.clientService ?? ClientService;

    const binding = this.container.bind<ClientServiceInterface>(CLIENT_SERVICE);

    typeof clientService === 'function' ? binding.toClass(clientService).asSingleton() : binding.toValue(clientService);
  }

  /**
   * Defines the Consent Service used by the Authorization Server.
   */
  private static setConsentService(): void {
    if (typeof this.settings.userInteraction === 'undefined') {
      return;
    }

    const consentService = this.authorizationServerOptions.consentService ?? ConsentService;

    const binding = this.container.bind<ConsentServiceInterface>(CONSENT_SERVICE);

    typeof consentService === 'function'
      ? binding.toClass(consentService).asSingleton()
      : binding.toValue(consentService);
  }

  /**
   * Defines the Device Code Service used by the Authorization Server.
   */
  private static setDeviceCodeService(): void {
    if (!this.settings.grantTypes.includes('urn:ietf:params:oauth:grant-type:device_code')) {
      return;
    }

    const deviceCodeService = this.authorizationServerOptions.deviceCodeService ?? DeviceCodeService;

    const binding = this.container.bind<DeviceCodeServiceInterface>(DEVICE_CODE_SERVICE);

    typeof deviceCodeService === 'function'
      ? binding.toClass(deviceCodeService).asSingleton()
      : binding.toValue(deviceCodeService);
  }

  /**
   * Defines the Session Service used by the Authorization Server.
   */
  private static setSessionService(): void {
    if (typeof this.settings.userInteraction === 'undefined') {
      return;
    }

    const sessionService = this.authorizationServerOptions.sessionService ?? SessionService;

    const binding = this.container.bind<SessionServiceInterface>(SESSION_SERVICE);

    typeof sessionService === 'function'
      ? binding.toClass(sessionService).asSingleton()
      : binding.toValue(sessionService);
  }

  /**
   * Defines the Grant Service used by the Authorization Server.
   */
  private static setGrantService(): void {
    if (typeof this.settings.userInteraction === 'undefined') {
      return;
    }

    const grantService = this.authorizationServerOptions.grantService ?? GrantService;

    const binding = this.container.bind<GrantServiceInterface>(GRANT_SERVICE);

    typeof grantService === 'function' ? binding.toClass(grantService).asSingleton() : binding.toValue(grantService);
  }

  /**
   * Defines the Refresh Token Service used by the Authorization Server.
   */
  private static setRefreshTokenService(): void {
    if (!this.settings.grantTypes.includes('refresh_token')) {
      return;
    }

    const refreshTokenService = this.authorizationServerOptions.refreshTokenService ?? RefreshTokenService;

    const binding = this.container.bind<RefreshTokenServiceInterface>(REFRESH_TOKEN_SERVICE);

    typeof refreshTokenService === 'function'
      ? binding.toClass(refreshTokenService).asSingleton()
      : binding.toValue(refreshTokenService);
  }

  /**
   * Defines the Login Service used by the Authorization Server.
   */
  private static setLoginService(): void {
    if (typeof this.settings.userInteraction === 'undefined') {
      return;
    }

    const sessionService = this.authorizationServerOptions.loginService ?? LoginService;

    const binding = this.container.bind<LoginServiceInterface>(LOGIN_SERVICE);

    typeof sessionService === 'function'
      ? binding.toClass(sessionService).asSingleton()
      : binding.toValue(sessionService);
  }

  /**
   * Defines the Logout Ticket Service used by the Authorization Server.
   */
  private static setLogoutTicketService(): void {
    if (typeof this.settings.userInteraction === 'undefined') {
      return;
    }

    const logoutTicketService = this.authorizationServerOptions.logoutTicketService ?? LogoutTicketService;

    const binding = this.container.bind<LogoutTicketServiceInterface>(LOGOUT_TICKET_SERVICE);

    typeof logoutTicketService === 'function'
      ? binding.toClass(logoutTicketService).asSingleton()
      : binding.toValue(logoutTicketService);
  }

  /**
   * Defines the User Service used by the Authorization Server.
   */
  private static setUserService(): void {
    const userService = this.authorizationServerOptions.userService ?? UserService;

    const binding = this.container.bind<UserServiceInterface>(USER_SERVICE);

    typeof userService === 'function' ? binding.toClass(userService).asSingleton() : binding.toValue(userService);
  }
}
