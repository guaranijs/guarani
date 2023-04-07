if (Reflect == null || !('getMetadata' in Reflect)) {
  throw new Error('@guarani/oauth2-server requires a Reflect Metadata polyfill.');
}

// Authorization Server
export { AuthorizationServer } from './lib/authorization-server';

// Backends
export { ExpressBackend } from './lib/backends/express/express.backend';
export { expressAuthorizationServer } from './lib/backends/express/express.middleware';

// Client Authentication
export { ClientAuthenticationInterface } from './lib/client-authentication/client-authentication.interface';
export { CLIENT_AUTHENTICATION } from './lib/client-authentication/client-authentication.token';
export { ClientAuthentication } from './lib/client-authentication/client-authentication.type';

// Client Authorization
export { ClientAuthorizationInterface } from './lib/client-authorization/client-authorization.interface';
export { CLIENT_AUTHORIZATION } from './lib/client-authorization/client-authorization.token';
export { ClientAuthorization } from './lib/client-authorization/client-authorization.type';

// Displays
export { DisplayInterface } from './lib/displays/display.interface';
export { DISPLAY } from './lib/displays/display.token';
export { Display } from './lib/displays/display.type';

// Endpoints
export { EndpointInterface } from './lib/endpoints/endpoint.interface';
export { ENDPOINT } from './lib/endpoints/endpoint.token';
export { Endpoint } from './lib/endpoints/endpoint.type';

// Entities
export { AccessToken } from './lib/entities/access-token.entity';
export { AuthorizationCode } from './lib/entities/authorization-code.entity';
export { Client } from './lib/entities/client.entity';
export { Consent } from './lib/entities/consent.entity';
export { DeviceCode } from './lib/entities/device-code.entity';
export { Grant } from './lib/entities/grant.entity';
export { RefreshToken } from './lib/entities/refresh-token.entity';
export { Session } from './lib/entities/session.entity';
export { User } from './lib/entities/user.entity';

// Exceptions
export { AccessDeniedException } from './lib/exceptions/access-denied.exception';
export { AuthorizationPendingException } from './lib/exceptions/authorization-pending.exception';
export { ConsentRequiredException } from './lib/exceptions/consent-required.exception';
export { ErrorCode } from './lib/exceptions/error-code.type';
export { ExpiredTokenException } from './lib/exceptions/expired-token.exception';
export { InsufficientScopeException } from './lib/exceptions/insufficient-scope.exception';
export { InvalidClientException } from './lib/exceptions/invalid-client.exception';
export { InvalidGrantException } from './lib/exceptions/invalid-grant.exception';
export { InvalidRequestException } from './lib/exceptions/invalid-request.exception';
export { InvalidScopeException } from './lib/exceptions/invalid-scope.exception';
export { InvalidTokenException } from './lib/exceptions/invalid-token.exception';
export { LoginRequiredException } from './lib/exceptions/login-required.exception';
export { OAuth2Exception } from './lib/exceptions/oauth2.exception';
export { OAuth2ExceptionParameters } from './lib/exceptions/oauth2.exception.parameters';
export { OAuth2ExceptionResponse } from './lib/exceptions/oauth2.exception.response';
export { ServerErrorException } from './lib/exceptions/server-error.exception';
export { SlowDownException } from './lib/exceptions/slow-down.exception';
export { TemporarilyUnavailableException } from './lib/exceptions/temporarily-unavailable.exception';
export { UnauthorizedClientException } from './lib/exceptions/unauthorized-client.exception';
export { UnsupportedGrantTypeException } from './lib/exceptions/unsupported-grant-type.exception';
export { UnsupportedInteractionTypeException } from './lib/exceptions/unsupported-interaction-type.exception';
export { UnsupportedResponseTypeException } from './lib/exceptions/unsupported-response-type.exception';
export { UnsupportedTokenTypeException } from './lib/exceptions/unsupported-token-type.exception';

// Grant Types
export { GrantTypeInterface } from './lib/grant-types/grant-type.interface';
export { GRANT_TYPE } from './lib/grant-types/grant-type.token';
export { GrantType } from './lib/grant-types/grant-type.type';

// Handlers
export { ClientAuthenticationHandler } from './lib/handlers/client-authentication.handler';
export { ClientAuthorizationHandler } from './lib/handlers/client-authorization.handler';
export { IdTokenHandler } from './lib/handlers/id-token.handler';
export { InteractionHandler } from './lib/handlers/interaction.handler';
export { ScopeHandler } from './lib/handlers/scope.handler';

// Http
export { HttpMethod } from './lib/http/http-method.type';
export { HttpRequest } from './lib/http/http.request';
export { HttpResponse } from './lib/http/http.response';

// ID Token
export { AddressClaimParameters } from './lib/id-token/address.claim.parameters';
export { IdTokenClaimsParameters } from './lib/id-token/id-token.claims.parameters';
export { UserinfoClaimsParameters } from './lib/id-token/userinfo.claims.parameters';

// Interaction Types
export { ConsentDecision } from './lib/interaction-types/consent-decision.type';
export { InteractionTypeInterface } from './lib/interaction-types/interaction-type.interface';
export { INTERACTION_TYPE } from './lib/interaction-types/interaction-type.token';
export { InteractionType } from './lib/interaction-types/interaction-type.type';
export { LoginDecision } from './lib/interaction-types/login-decision.type';

// Metadata
export { AuthorizationServerFactory } from './lib/metadata/authorization-server.factory';
export { AuthorizationServerOptions } from './lib/metadata/authorization-server.options';

// PKCE
export { PkceInterface } from './lib/pkces/pkce.interface';
export { PKCE } from './lib/pkces/pkce.token';
export { Pkce } from './lib/pkces/pkce.type';

// Prompts
export { PromptInterface } from './lib/prompts/prompt.interface';
export { PROMPT } from './lib/prompts/prompt.token';
export { Prompt } from './lib/prompts/prompt.type';

// Requests
export { AuthorizationRequest } from './lib/requests/authorization/authorization-request';
export { CodeAuthorizationRequest } from './lib/requests/authorization/code.authorization-request';
export { DeviceAuthorizationRequest } from './lib/requests/device-authorization-request';
export { ConsentContextInteractionRequest } from './lib/requests/interaction/consent-context.interaction-request';
export { ConsentDecisionAcceptInteractionRequest } from './lib/requests/interaction/consent-decision-accept.interaction-request';
export { ConsentDecisionDenyInteractionRequest } from './lib/requests/interaction/consent-decision-deny.interaction-request';
export { ConsentDecisionInteractionRequest } from './lib/requests/interaction/consent-decision.interaction-request';
export { InteractionRequest } from './lib/requests/interaction/interaction-request';
export { LoginContextInteractionRequest } from './lib/requests/interaction/login-context.interaction-request';
export { LoginDecisionAcceptInteractionRequest } from './lib/requests/interaction/login-decision-accept.interaction-request';
export { LoginDecisionDenyInteractionRequest } from './lib/requests/interaction/login-decision-deny.interaction-request';
export { LoginDecisionInteractionRequest } from './lib/requests/interaction/login-decision.interaction-request';
export { IntrospectionRequest } from './lib/requests/introspection-request';
export { RevocationRequest } from './lib/requests/revocation-request';
export { AuthorizationCodeTokenRequest } from './lib/requests/token/authorization-code.token-request';
export { ClientCredentialsTokenRequest } from './lib/requests/token/client-credentials.token-request';
export { DeviceCodeTokenRequest } from './lib/requests/token/device-code.token-request';
export { JwtBearerTokenRequest } from './lib/requests/token/jwt-bearer.token-request';
export { RefreshTokenTokenRequest } from './lib/requests/token/refresh-token.token-request';
export { ResourceOwnerPasswordCredentialsTokenRequest } from './lib/requests/token/resource-owner-password-credentials.token-request';
export { TokenRequest } from './lib/requests/token/token-request';

// Response Modes
export { ResponseModeInterface } from './lib/response-modes/response-mode.interface';
export { RESPONSE_MODE } from './lib/response-modes/response-mode.token';
export { ResponseMode } from './lib/response-modes/response-mode.type';

// Response Types
export { ResponseTypeInterface } from './lib/response-types/response-type.interface';
export { RESPONSE_TYPE } from './lib/response-types/response-type.token';
export { ResponseType } from './lib/response-types/response-type.type';

// Responses
export { AuthorizationResponse } from './lib/responses/authorization/authorization-response';
export { CodeAuthorizationResponse } from './lib/responses/authorization/code.authorization-response';
export { ConsentContextInteractionResponse } from './lib/responses/interaction/consent-context.interaction-response';
export { ConsentContext } from './lib/responses/interaction/consent.context';
export { DeviceAuthorizationResponse } from './lib/responses/device-authorization-response';
export { DiscoveryResponse } from './lib/responses/discovery-response';
export { IdTokenAuthorizationResponse } from './lib/responses/authorization/id-token.authorization-response';
export { IntrospectionResponse } from './lib/responses/introspection-response';
export { LoginContextInteractionResponse } from './lib/responses/interaction/login-context.interaction-response';
export { LoginDecisionInteractionResponse } from './lib/responses/interaction/login-decision.interaction-response';
export { LoginContext } from './lib/responses/interaction/login.context';
export { TokenResponse } from './lib/responses/token-response';
export { TokenAuthorizationResponse } from './lib/responses/authorization/token.authorization-response';
export { ConsentDecisionInteractionResponse } from './lib/responses/interaction/consent-decision.interaction-response';

// Services
export { AccessTokenService } from './lib/services/default/access-token.service';
export { AuthorizationCodeService } from './lib/services/default/authorization-code.service';
export { ClientService } from './lib/services/default/client.service';
export { ConsentService } from './lib/services/default/consent.service';
export { DeviceCodeService } from './lib/services/default/device-code.service';
export { GrantService } from './lib/services/default/grant.service';
export { RefreshTokenService } from './lib/services/default/refresh-token.service';
export { SessionService } from './lib/services/default/session.service';
export { UserService } from './lib/services/default/user.service';
export { AccessTokenServiceInterface } from './lib/services/access-token.service.interface';
export { ACCESS_TOKEN_SERVICE } from './lib/services/access-token.service.token';
export { AuthorizationCodeServiceInterface } from './lib/services/authorization-code.service.interface';
export { AUTHORIZATION_CODE_SERVICE } from './lib/services/authorization-code.service.token';
export { ClientServiceInterface } from './lib/services/client.service.interface';
export { CLIENT_SERVICE } from './lib/services/client.service.token';
export { ConsentServiceInterface } from './lib/services/consent.service.interface';
export { CONSENT_SERVICE } from './lib/services/consent.service.token';
export { DeviceCodeServiceInterface } from './lib/services/device-code.service.interface';
export { DEVICE_CODE_SERVICE } from './lib/services/device-code.service.token';
export { GrantServiceInterface } from './lib/services/grant.service.interface';
export { GRANT_SERVICE } from './lib/services/grant.service.token';
export { RefreshTokenServiceInterface } from './lib/services/refresh-token.service.interface';
export { REFRESH_TOKEN_SERVICE } from './lib/services/refresh-token.service.token';
export { SessionServiceInterface } from './lib/services/session.service.interface';
export { SESSION_SERVICE } from './lib/services/session.service.token';
export { UserServiceInterface } from './lib/services/user.service.interface';
export { USER_SERVICE } from './lib/services/user.service.token';

// Settings
export { Settings } from './lib/settings/settings';
export { SETTINGS } from './lib/settings/settings.token';
export { UserInteractionSettings } from './lib/settings/user-interaction.settings';

// Types
export { AccessTokenType } from './lib/types/access-token-type.type';
export { ApplicationType } from './lib/types/application-type.type';
export { TokenTypeHint } from './lib/types/token-type-hint.type';
