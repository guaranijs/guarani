import { defineMetadata } from './helpers/define-metadata';
import { MetadataToken } from './metadata-token';
import { AuthorizationServerMetadataParameters } from './types/authorization-server-metadata.parameters';

/**
 * Decorates an Authorization Server class by providing its necessary metadata.
 *
 * @param metadata Parameters of the Authorization Server Metadata.
 */
export function AuthorizationServerMetadata(metadata: AuthorizationServerMetadataParameters): ClassDecorator {
  return function (target: Function): void {
    defineMetadata(MetadataToken.Issuer, metadata.issuer, target);
    defineMetadata(MetadataToken.Scopes, metadata.scopes, target);
    defineMetadata(MetadataToken.ClientAuthentication, metadata.clientAuthenticationMethods, target);
    defineMetadata(MetadataToken.Endpoints, metadata.endpoints, target);
    defineMetadata(MetadataToken.ErrorUrl, metadata.errorUrl, target);
    defineMetadata(MetadataToken.GrantTypes, metadata.grantTypes, target);
    defineMetadata(MetadataToken.ResponseTypes, metadata.responseTypes, target);
    defineMetadata(MetadataToken.ResponseModes, metadata.responseModes, target);
    defineMetadata(MetadataToken.PkceMethods, metadata.pkceMethods, target);
    defineMetadata(MetadataToken.ClientService, metadata.clientService, target);
    defineMetadata(MetadataToken.AccessTokenService, metadata.accessTokenService, target);
    defineMetadata(MetadataToken.UserService, metadata.userService, target);
    defineMetadata(MetadataToken.AuthorizationCodeService, metadata.authorizationCodeService, target);
    defineMetadata(MetadataToken.RefreshTokenService, metadata.refreshTokenService, target);
  };
}
