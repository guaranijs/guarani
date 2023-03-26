import { Constructor, getContainer } from '@guarani/di';
import { JsonWebKeySet } from '@guarani/jose';

import { AuthorizationServer } from '../authorization-server';
import { ClientAuthenticationInterface } from '../client-authentication/client-authentication.interface';
import { clientAuthenticationRegistry } from '../client-authentication/client-authentication.registry';
import { CLIENT_AUTHENTICATION } from '../client-authentication/client-authentication.token';
import { ClientAuthentication } from '../client-authentication/client-authentication.type';
import { AuthorizationEndpoint } from '../endpoints/authorization.endpoint';
import { DeviceAuthorizationEndpoint } from '../endpoints/device-authorization.endpoint';
import { DiscoveryEndpoint } from '../endpoints/discovery.endpoint';
import { EndpointInterface } from '../endpoints/endpoint.interface';
import { ENDPOINT } from '../endpoints/endpoint.token';
import { InteractionEndpoint } from '../endpoints/interaction.endpoint';
import { IntrospectionEndpoint } from '../endpoints/introspection.endpoint';
import { JsonWebKeySetEndpoint } from '../endpoints/jsonwebkeyset.endpoint';
import { RevocationEndpoint } from '../endpoints/revocation.endpoint';
import { TokenEndpoint } from '../endpoints/token.endpoint';
import { GrantTypeInterface } from '../grant-types/grant-type.interface';
import { grantTypeRegistry } from '../grant-types/grant-type.registry';
import { GRANT_TYPE } from '../grant-types/grant-type.token';
import { GrantType } from '../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { InteractionHandler } from '../handlers/interaction.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { InteractionTypeInterface } from '../interaction-types/interaction-type.interface';
import { interactionTypeRegistry } from '../interaction-types/interaction-type.registry';
import { INTERACTION_TYPE } from '../interaction-types/interaction-type.token';
import { PkceMethod } from '../pkce/pkce-method.type';
import { PkceInterface } from '../pkce/pkce.interface';
import { pkceRegistry } from '../pkce/pkce.registry';
import { PKCE } from '../pkce/pkce.token';
import { PromptInterface } from '../prompts/prompt.interface';
import { promptRegistry } from '../prompts/prompt.registry';
import { PROMPT } from '../prompts/prompt.token';
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
import { RefreshTokenService } from '../services/default/refresh-token.service';
import { SessionService } from '../services/default/session.service';
import { UserService } from '../services/default/user.service';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
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
    options: AuthorizationServerOptions
  ): Promise<T> {
    Reflect.set(this, 'authorizationServerOptions', options);

    await this.configure();

    this.container.bind(AuthorizationServer).toClass(server).asSingleton();

    return <T>this.container.resolve(AuthorizationServer);
  }

  /**
   * Bootstraps the Configuration of the OAuth 2.0 Authorization Server.
   */
  private static async configure(): Promise<void> {
    await this.setAuthorizationServerSettings();
    this.setClientAuthentication();
    this.setGrantTypes();
    this.setPrompts();
    this.setInteractionTypes();
    this.setResponseTypes();
    this.setResponseModes();
    this.setPkceMethods();
    this.setJsonWebKeySet();
    this.setEndpoints();
    this.setHandlers();
    this.setAccessTokenService();
    this.setAuthorizationCodeService();
    this.setClientService();
    this.setConsentService();
    this.setDeviceCodeService();
    this.setGrantService();
    this.setRefreshTokenService();
    this.setSessionService();
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
      pkceMethods: this.authorizationServerOptions.pkceMethods ?? <PkceMethod[]>Object.keys(pkceRegistry),
      clientAuthenticationSignatureAlgorithms:
        this.authorizationServerOptions.clientAuthenticationSignatureAlgorithms ?? [],
      jwks:
        this.authorizationServerOptions.jwks !== undefined
          ? await JsonWebKeySet.load(this.authorizationServerOptions.jwks)
          : undefined,
      userInteraction: this.authorizationServerOptions.userInteraction,
      enableRefreshTokenRotation: this.authorizationServerOptions.enableRefreshTokenRotation ?? false,
      enableAccessTokenRevocation: this.authorizationServerOptions.enableAccessTokenRevocation ?? true,
      enableRefreshTokenIntrospection: this.authorizationServerOptions.enableRefreshTokenIntrospection ?? false,
      devicePollingInterval: this.authorizationServerOptions.devicePollingInterval ?? 5,
      enableAuthorizationResponseIssuerIdentifier:
        this.authorizationServerOptions.enableAuthorizationResponseIssuerIdentifier ?? false,
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
      const constructor = <Constructor<ClientAuthenticationInterface>>(
        clientAuthenticationRegistry[clientAuthenticationMethod]
      );

      this.container.bind<ClientAuthenticationInterface>(CLIENT_AUTHENTICATION).toClass(constructor).asSingleton();
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
      const constructor = <Constructor<GrantTypeInterface>>grantTypeRegistry[grantType];
      this.container.bind<GrantTypeInterface>(GRANT_TYPE).toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the Prompts supported by the Authorization Server.
   */
  private static setPrompts(): void {
    Object.values(promptRegistry).forEach((prompt) => {
      this.container.bind<PromptInterface>(PROMPT).toClass(prompt).asSingleton();
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
   * Defines the Response Types supported by the Authorization Server.
   */
  private static setResponseTypes(): void {
    const { responseTypes } = this.settings;

    if (responseTypes.length === 0) {
      return;
    }

    responseTypes.forEach((responseType) => {
      const constructor = <Constructor<ResponseTypeInterface>>responseTypeRegistry[responseType];
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
      const constructor = <Constructor<ResponseModeInterface>>responseModeRegistry[responseMode];
      this.container.bind<ResponseModeInterface>(RESPONSE_MODE).toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the PKCE Methods supported by the Authorization Server.
   */
  private static setPkceMethods(): void {
    const { pkceMethods } = this.settings;

    if (pkceMethods.length === 0) {
      return;
    }

    pkceMethods.forEach((pkceMethod) => {
      const constructor = <Constructor<PkceInterface>>pkceRegistry[pkceMethod];
      this.container.bind<PkceInterface>(PKCE).toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the JSON Web Key Set of the Authorization Server.
   */
  private static setJsonWebKeySet(): void {
    const { jwks } = this.settings;

    if (jwks === undefined) {
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

    if (this.settings.jwks instanceof JsonWebKeySet) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(JsonWebKeySetEndpoint).asSingleton();
    }

    if (this.settings.grantTypes.includes('urn:ietf:params:oauth:grant-type:device_code')) {
      this.container.bind<EndpointInterface>(ENDPOINT).toClass(DeviceAuthorizationEndpoint).asSingleton();
    }

    this.container.bind<EndpointInterface>(ENDPOINT).toClass(DiscoveryEndpoint).asSingleton();
  }

  /**
   * Defines the Handlers of the Authorization Server.
   */
  private static setHandlers(): void {
    this.container.bind(ClientAuthenticationHandler).toSelf().asSingleton();
    this.container.bind(ScopeHandler).toSelf().asSingleton();
    this.container.bind(InteractionHandler).toSelf().asSingleton();

    if (this.settings.scopes.includes('openid')) {
      this.container.bind(IdTokenHandler).toSelf().asSingleton();
    }
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
    if (this.settings.userInteraction === undefined) {
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
   * Defines the Grant Service used by the Authorization Server.
   */
  private static setGrantService(): void {
    if (this.settings.userInteraction === undefined) {
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
   * Defines the Session Service used by the Authorization Server.
   */
  private static setSessionService(): void {
    if (this.settings.userInteraction === undefined) {
      return;
    }

    const sessionService = this.authorizationServerOptions.sessionService ?? SessionService;

    const binding = this.container.bind<SessionServiceInterface>(SESSION_SERVICE);

    typeof sessionService === 'function'
      ? binding.toClass(sessionService).asSingleton()
      : binding.toValue(sessionService);
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
