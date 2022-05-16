import { getContainer } from '@guarani/di';
import { Constructor, ConstructorOrInstance } from '@guarani/types';

import { AuthorizationServer } from '../authorization-server/authorization-server';
import { AuthorizationServerOptions } from '../authorization-server/options/authorization-server.options';
import { IClientAuthentication } from '../client-authentication/client-authentication.interface';
import { CLIENT_AUTHENTICATION_REGISTRY } from '../client-authentication/client-authentication.registry';
import { ClientAuthenticator } from '../client-authentication/client-authenticator';
import { AuthorizationEndpoint } from '../endpoints/authorization.endpoint';
import { IEndpoint } from '../endpoints/endpoint.interface';
import { IntrospectionEndpoint } from '../endpoints/introspection.endpoint';
import { RevocationEndpoint } from '../endpoints/revocation.endpoint';
import { TokenEndpoint } from '../endpoints/token.endpoint';
import { IGrantType } from '../grant-types/grant-type.interface';
import { GRANT_TYPE_REGISTRY } from '../grant-types/grant-type.registry';
import { ScopeHandler } from '../handlers/scope.handler';
import { IPkceMethod } from '../pkce/pkce-method.interface';
import { PKCE_METHOD_REGISTRY } from '../pkce/pkce-method.registry';
import { IResponseMode } from '../response-modes/response-mode.interface';
import { RESPONSE_MODE_REGISTRY } from '../response-modes/response-mode.registry';
import { IResponseType } from '../response-types/response-type.interface';
import { RESPONSE_TYPE_REGISTRY } from '../response-types/response-type.registry';
import { IAccessTokenService } from '../services/access-token.service.interface';
import { IAuthorizationCodeService } from '../services/authorization-code.service.interface';
import { IClientService } from '../services/client.service.interface';
import { IRefreshTokenService } from '../services/refresh-token.service.interface';
import { IUserService } from '../services/user.service.interface';
import { ClientAuthentication } from '../types/client-authentication';
import { GrantType } from '../types/grant-type';
import { PkceMethod } from '../types/pkce-method';
import { ResponseMode } from '../types/response-mode';
import { ResponseType } from '../types/response-type';
import { AuthorizationServerMetadataOptions } from './authorization-server-metadata.options';
import { getMetadata } from './helpers/get-metadata';
import {
  ACCESS_TOKEN_SERVICE,
  AUTHORIZATION_CODE_SERVICE,
  AUTHORIZATION_SERVER_OPTIONS,
  CLIENT_AUTHENTICATION,
  CLIENT_SERVICE,
  GRANT_TYPE,
  ORIGINAL_METADATA,
  PKCE_METHOD,
  REFRESH_TOKEN_SERVICE,
  RESPONSE_MODE,
  RESPONSE_TYPE,
  USER_SERVICE,
} from './injectable-tokens';

/**
 * Factory class for configuring and instantiating an OAuth 2.0 Authorization Server.
 */
class AuthorizationServerFactory {
  /**
   * Dependency Injection Container of the OAuth 2.0 Authorization Server.
   */
  private readonly container = getContainer('oauth2');

  /**
   * Fabricates a new instance of the provided OAuth 2.0 Authorization Server.
   *
   * @param server Authorization Server Constructor.
   * @returns Instance of the provided Authorization Server.
   */
  public async create<T extends AuthorizationServer>(server: Constructor<T>): Promise<T> {
    this.configure(server);
    this.container.bind<AuthorizationServer>('AuthorizationServer').toClass(server).asSingleton();
    return this.container.resolve<T>('AuthorizationServer');
  }

  /**
   * Bootstraps the Configuration of the OAuth 2.0 Authorization Server.
   *
   * @param server Authorization Server.
   */
  private configure(server: Constructor<AuthorizationServer>): void {
    this.setAuthorizationServerOptions(server);
    this.setClientAuthentication(server);
    this.setGrantTypes(server);
    this.setResponseTypes(server);
    this.setResponseModes(server);
    this.setPkceMethods(server);
    this.setEndpoints(server);
    this.setHandlers();
    this.setAccessTokenService(server);
    this.setAuthorizationCodeService(server);
    this.setClientService(server);
    this.setRefreshTokenService(server);
    this.setUserService(server);
  }

  /**
   * Defines the Settings of the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setAuthorizationServerOptions(server: Constructor<AuthorizationServer>): void {
    const options = getMetadata<AuthorizationServerOptions>(AUTHORIZATION_SERVER_OPTIONS, server);

    if (options === undefined) {
      throw new TypeError('Missing required Authorization Server Options.');
    }

    this.container.bind<AuthorizationServerOptions>('AuthorizationServerOptions').toValue(options);
  }

  /**
   * Defines the Client Authentication Methods supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setClientAuthentication(server: Constructor<AuthorizationServer>): void {
    let clientAuthenticationMethods = getMetadata<ClientAuthentication[]>(CLIENT_AUTHENTICATION, server);

    if (clientAuthenticationMethods === undefined) {
      clientAuthenticationMethods = ['client_secret_basic'];
    }

    if (clientAuthenticationMethods.length === 0) {
      return;
    }

    clientAuthenticationMethods.forEach((clientAuthenticationMethod) => {
      const constructor = CLIENT_AUTHENTICATION_REGISTRY[clientAuthenticationMethod];
      this.container.bind<IClientAuthentication>('ClientAuthentication').toClass(constructor).asSingleton();
    });

    this.container.bind(ClientAuthenticator).toSelf().asSingleton();
  }

  /**
   * Defines the Grant Types supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setGrantTypes(server: Constructor<AuthorizationServer>): void {
    let grantTypes = getMetadata<GrantType[]>(GRANT_TYPE, server);

    if (grantTypes === undefined) {
      grantTypes = ['authorization_code'];
    }

    if (grantTypes.length === 0) {
      return;
    }

    grantTypes.forEach((grantType) => {
      const constructor = GRANT_TYPE_REGISTRY[grantType];
      this.container.bind<IGrantType>('GrantType').toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the Response Types supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setResponseTypes(server: Constructor<AuthorizationServer>): void {
    let responseTypes = getMetadata<ResponseType[]>(RESPONSE_TYPE, server);

    if (responseTypes === undefined) {
      responseTypes = ['code'];
    }

    if (responseTypes.length === 0) {
      return;
    }

    responseTypes.forEach((responseType) => {
      const constructor = RESPONSE_TYPE_REGISTRY[responseType];
      this.container.bind<IResponseType>('ResponseType').toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the Response Modes supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setResponseModes(server: Constructor<AuthorizationServer>): void {
    let responseModes = getMetadata<ResponseMode[]>(RESPONSE_MODE, server);

    if (responseModes === undefined) {
      responseModes = ['query'];
    }

    if (responseModes.length === 0) {
      return;
    }

    responseModes.forEach((responseMode) => {
      const constructor = RESPONSE_MODE_REGISTRY[responseMode];
      this.container.bind<IResponseMode>('ResponseMode').toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the PKCE Methods supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setPkceMethods(server: Constructor<AuthorizationServer>): void {
    let pkceMethods = getMetadata<PkceMethod[]>(PKCE_METHOD, server);

    if (pkceMethods === undefined) {
      pkceMethods = ['S256'];
    }

    if (pkceMethods.length === 0) {
      return;
    }

    pkceMethods.forEach((pkceMethod) => {
      const constructor = PKCE_METHOD_REGISTRY[pkceMethod];
      this.container.bind<IPkceMethod>('PkceMethod').toClass(constructor).asSingleton();
    });
  }

  /**
   * Defines the Endpoints supported by the Authorization Server.
   */
  private setEndpoints(server: Constructor<AuthorizationServer>): void {
    const originalMetadata = getMetadata<AuthorizationServerMetadataOptions>(ORIGINAL_METADATA, server)!;

    const hasAuthorizationEndpoint = this.container.isRegistered<IResponseType>('ResponseType');
    const hasTokenEndpoint = this.container.isRegistered<IGrantType>('GrantType');

    if (!hasAuthorizationEndpoint && !hasTokenEndpoint) {
      throw new Error('Cannot instantiate an Authorization Server without Grants.');
    }

    if (hasAuthorizationEndpoint) {
      this.container.bind<IEndpoint>('Endpoint').toClass(AuthorizationEndpoint).asSingleton();
    }

    if (hasTokenEndpoint) {
      this.container.bind<IEndpoint>('Endpoint').toClass(TokenEndpoint).asSingleton();
    }

    if (originalMetadata.enableRevocationEndpoint !== false) {
      this.container.bind<IEndpoint>('Endpoint').toClass(RevocationEndpoint).asSingleton();
    }

    if (originalMetadata.enableIntrospectionEndpoint !== false) {
      this.container.bind<IEndpoint>('Endpoint').toClass(IntrospectionEndpoint).asSingleton();
    }
  }

  /**
   * Defines the Handlers of the Authorization Server.
   */
  private setHandlers(): void {
    this.container.bind(ScopeHandler).toSelf().asSingleton();
  }

  /**
   * Defines the Access Token Service used by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setAccessTokenService(server: Constructor<AuthorizationServer>): void {
    const accessTokenService = getMetadata<ConstructorOrInstance<IAccessTokenService>>(ACCESS_TOKEN_SERVICE, server);

    if (accessTokenService === undefined) {
      throw new Error('The Access Token Service must be defined.');
    }

    const binding = this.container.bind<IAccessTokenService>('AccessTokenService');

    typeof accessTokenService === 'function'
      ? binding.toClass(accessTokenService)
      : binding.toValue(accessTokenService);
  }

  /**
   * Defines the Authorization Code Service used by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setAuthorizationCodeService(server: Constructor<AuthorizationServer>): void {
    const authorizationCodeService = getMetadata<ConstructorOrInstance<IAuthorizationCodeService>>(
      AUTHORIZATION_CODE_SERVICE,
      server
    );

    if (authorizationCodeService === undefined) {
      return;
    }

    const binding = this.container.bind<IAuthorizationCodeService>('AuthorizationCodeService');

    typeof authorizationCodeService === 'function'
      ? binding.toClass(authorizationCodeService)
      : binding.toValue(authorizationCodeService);
  }

  /**
   * Defines the Client Service used by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setClientService(server: Constructor<AuthorizationServer>): void {
    const clientService = getMetadata<ConstructorOrInstance<IClientService>>(CLIENT_SERVICE, server);

    if (clientService === undefined) {
      throw new Error('The Client Service must be defined.');
    }

    const binding = this.container.bind<IClientService>('ClientService');

    typeof clientService === 'function' ? binding.toClass(clientService) : binding.toValue(clientService);
  }

  /**
   * Defines the Refresh Token Service used by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setRefreshTokenService(server: Constructor<AuthorizationServer>): void {
    const refreshTokenService = getMetadata<ConstructorOrInstance<IRefreshTokenService>>(REFRESH_TOKEN_SERVICE, server);

    if (refreshTokenService === undefined) {
      return;
    }

    const binding = this.container.bind<IRefreshTokenService>('RefreshTokenService');

    typeof refreshTokenService === 'function'
      ? binding.toClass(refreshTokenService)
      : binding.toValue(refreshTokenService);
  }

  /**
   * Defines the User Service used by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private setUserService(server: Constructor<AuthorizationServer>): void {
    const userService = getMetadata<ConstructorOrInstance<IUserService>>(USER_SERVICE, server);

    if (userService === undefined) {
      return;
    }

    const binding = this.container.bind<IUserService>('UserService');

    typeof userService === 'function' ? binding.toClass(userService) : binding.toValue(userService);
  }
}

export const OAuth2Factory = new AuthorizationServerFactory();
