import { getContainer } from '@guarani/ioc';
import { Constructor } from '@guarani/types';

import { URL } from 'url';

import { AuthorizationServer } from '../authorization-server';
import { ClientAuthentication } from '../client-authentication/client-authentication';
import { AuthorizationEndpoint } from '../endpoints/authorization.endpoint';
import { Endpoint } from '../endpoints/endpoint';
import { TokenEndpoint } from '../endpoints/token.endpoint';
import { GrantType } from '../grant-types/grant-type';
import { PkceMethod } from '../pkce/pkce-method';
import { ResponseMode } from '../response-modes/response-mode';
import { ResponseType } from '../response-types/response-type';
import { AccessTokenService } from '../services/access-token.service';
import { AuthorizationCodeService } from '../services/authorization-code.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { UserService } from '../services/user.service';
import { getMetadata } from './helpers/get-metadata';
import { MetadataToken } from './metadata-token';

/**
 * Factory class for configuring and instantiating an OAuth 2.0 Authorization Server.
 */
export class OAuth2Factory {
  /**
   * Dependency Injection Container of the OAuth 2.0 Authorization Server.
   */
  private static readonly container = getContainer('oauth2');

  /**
   * Fabricates a new instance of the provided OAuth 2.0 Authorization Server.
   *
   * @param server Authorization Server Constructor.
   * @returns Instance of the provided Authorization Server.
   */
  public static create<T extends AuthorizationServer>(server: Constructor<T>): T {
    this.configure(server);
    this.container.bindToken<AuthorizationServer>('AuthorizationServer').toClass(server).asSingleton();

    return this.container.resolve<T>('AuthorizationServer');
  }

  /**
   * Bootstraps the Configuration of the OAuth 2.0 Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static configure(server: Constructor<AuthorizationServer>): void {
    this.setIssuer(server);
    this.setErrorUrl(server);
    this.setScopes(server);
    this.setClientAuthentication(server);
    this.setEndpoints(server);
    this.setGrantTypes(server);
    this.setResponseTypes(server);
    this.setResponseModes(server);
    this.setPkceMethods(server);
    this.setAccessTokenService(server);
    this.setUserService(server);
    this.setAuthorizationCodeService(server);
    this.setRefreshTokenService(server);
  }

  /**
   * Defines the URL of the Issuer of the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setIssuer(server: Constructor<AuthorizationServer>): void {
    const issuer = getMetadata<string>(MetadataToken.Issuer, server)!;
    this.container.bindToken<string>('Issuer').toValue(issuer);
  }

  /**
   * Defines the URL of the Error Endpoint of the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setErrorUrl(server: Constructor<AuthorizationServer>): void {
    const issuer = getMetadata<string>(MetadataToken.Issuer, server)!;
    const errorUrl = getMetadata<string>(MetadataToken.ErrorUrl, server)!;

    this.container.bindToken<string>('ErrorUrl').toValue(new URL(errorUrl, issuer).href);
  }

  /**
   * Defines the Scopes supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setScopes(server: Constructor<AuthorizationServer>): void {
    const scopes = getMetadata<string[]>(MetadataToken.Scopes, server)!;
    this.container.bindToken<string>('Scopes').toValue(scopes);
  }

  /**
   * Defines the Client Authentication Methods supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setClientAuthentication(server: Constructor<AuthorizationServer>): void {
    const clientAuthenticationMethods = getMetadata<Constructor<ClientAuthentication>[]>(
      MetadataToken.ClientAuthentication,
      server
    );

    if (clientAuthenticationMethods === undefined) {
      this.container.bindToken<ClientAuthentication>('ClientAuthenticaton').toValue<ClientAuthentication[]>([]);
    } else {
      clientAuthenticationMethods.forEach((clientAuthenticationMethod) => {
        this.container.bindToken<ClientAuthentication>('ClientAuthentication').toClass(clientAuthenticationMethod);
      });
    }
  }

  /**
   * Defines the Endpoints supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setEndpoints(server: Constructor<AuthorizationServer>): void {
    const endpoints = getMetadata<Constructor<Endpoint>[]>(MetadataToken.Endpoints, server);

    if (endpoints === undefined) {
      this.container.bindToken<Endpoint>('Endpoint').toValue<Endpoint[]>([]);
    } else {
      endpoints.forEach((endpoint) => {
        this.container.bindToken<Endpoint>('Endpoint').toClass(endpoint);
      });
    }
  }

  /**
   * Defines the Grant Types supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setGrantTypes(server: Constructor<AuthorizationServer>): void {
    const grantTypes = getMetadata<Constructor<GrantType>[]>(MetadataToken.GrantTypes, server);

    if (grantTypes === undefined) {
      this.container.bindToken<GrantType>('GrantType').toValue<GrantType[]>([]);
    } else {
      this.container.bindToken<Endpoint>('Endpoint').toClass(TokenEndpoint);

      grantTypes.forEach((grantType) => {
        this.container.bindToken<GrantType>('GrantType').toClass(grantType);
      });
    }
  }

  /**
   * Defines the Response Types supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setResponseTypes(server: Constructor<AuthorizationServer>): void {
    const responseTypes = getMetadata<Constructor<ResponseType>[]>(MetadataToken.ResponseTypes, server);

    if (responseTypes === undefined) {
      this.container.bindToken<ResponseType>('ResponseType').toValue<ResponseType[]>([]);
    } else {
      this.container.bindToken<Endpoint>('Endpoint').toClass(AuthorizationEndpoint);

      responseTypes.forEach((responseType) => {
        this.container.bindToken<ResponseType>('ResponseType').toClass(responseType);
      });
    }
  }

  /**
   * Defines the Response Modes supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setResponseModes(server: Constructor<AuthorizationServer>): void {
    const responseModes = getMetadata<Constructor<ResponseMode>[]>(MetadataToken.ResponseModes, server);

    if (responseModes === undefined) {
      this.container.bindToken<ResponseMode>('ResponseMode').toValue<ResponseMode[]>([]);
    } else {
      responseModes.forEach((responseMode) => {
        this.container.bindToken<ResponseMode>('ResponseMode').toClass(responseMode);
      });
    }
  }

  /**
   * Defines the PKCE Methods supported by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setPkceMethods(server: Constructor<AuthorizationServer>): void {
    const pkceMethods = getMetadata<Constructor<PkceMethod>[]>(MetadataToken.PkceMethods, server);

    if (pkceMethods === undefined) {
      this.container.bindToken<PkceMethod>('PkceMethod').toValue<PkceMethod[]>([]);
    } else {
      pkceMethods.forEach((pkceMethod) => {
        this.container.bindToken<PkceMethod>('PkceMethod').toClass(pkceMethod);
      });
    }
  }

  /**
   * Defines the Access Token Service used by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setAccessTokenService(server: Constructor<AuthorizationServer>): void {
    const accessTokenService = <AccessTokenService>getMetadata(MetadataToken.AccessTokenService, server);

    this.container.bindToken<AccessTokenService>('AccessTokenService').toValue(accessTokenService).asSingleton();
  }

  /**
   * Defines the User Service used by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setUserService(server: Constructor<AuthorizationServer>): void {
    const userService = getMetadata<UserService>(MetadataToken.UserService, server);

    this.container.bindToken<UserService>('UserService').toValue(userService).asSingleton();
  }

  /**
   * Defines the Authorization Code Service used by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setAuthorizationCodeService(server: Constructor<AuthorizationServer>): void {
    const authorizationCodeService = getMetadata<AuthorizationCodeService>(
      MetadataToken.AuthorizationCodeService,
      server
    );

    this.container
      .bindToken<AuthorizationCodeService>('AuthorizationCodeService')
      .toValue(authorizationCodeService)
      .asSingleton();
  }

  /**
   * Defines the Refresh Token Service used by the Authorization Server.
   *
   * @param server Authorization Server.
   */
  private static setRefreshTokenService(server: Constructor<AuthorizationServer>): void {
    const refreshTokenService = getMetadata<RefreshTokenService>(MetadataToken.RefreshTokenService, server);

    this.container.bindToken<RefreshTokenService>('RefreshTokenService').toValue(refreshTokenService).asSingleton();
  }
}
