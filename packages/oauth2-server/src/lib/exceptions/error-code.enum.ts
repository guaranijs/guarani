/**
 * Error Codes supported by Guarani.
 */
export enum ErrorCode {
  /**
   * The User did not authorize the Client.
   */
  AccessDenied = 'access_denied',

  /**
   * The Authorization Server requires Account Selection from the User.
   */
  AccountSelectionRequired = 'account_selection_required',

  /**
   * The User did not yet authorize the Device Code.
   */
  AuthorizationPending = 'authorization_pending',

  /**
   * The Authorization Server requires Consent from the User.
   */
  ConsentRequired = 'consent_required',

  /**
   * The provided Access Token is expired.
   */
  ExpiredToken = 'expired_token',

  /**
   * The provided Access Token does not have the required scope to access the resource.
   */
  InsufficientScope = 'insufficient_scope',

  /**
   * The Client is invalid or failed authentication.
   */
  InvalidClient = 'invalid_client',

  /**
   * The provided Client Metadata is invalid.
   */
  InvalidClientMetadata = 'invalid_client_metadata',

  /**
   * The provided Grant is invalid.
   */
  InvalidGrant = 'invalid_grant',

  /**
   * The provided Redirect URI is invalid.
   */
  InvalidRedirectUri = 'invalid_redirect_uri',

  /**
   * The Request is invalid, contains invalid parameters or is otherwise malformed.
   */
  InvalidRequest = 'invalid_request',

  /**
   * The requested scope is invalid.
   */
  InvalidScope = 'invalid_scope',

  /**
   * The provided Access Token is invalid.
   */
  InvalidToken = 'invalid_token',

  /**
   * The Authorization Server requires that the User re-authenticates.
   */
  LoginRequired = 'login_required',

  /**
   * The Authorization Server encountered an unexpected error.
   */
  ServerError = 'server_error',

  /**
   * The Client should slow down the rate at which it requests a response from the Device Code Grant.
   */
  SlowDown = 'slow_down',

  /**
   * The Authorization Server is temporarily unavailable.
   */
  TemporarilyUnavailable = 'temporarily_unavailable',

  /**
   * The Client is not allowed to request the provided Grant.
   */
  UnauthorizedClient = 'unauthorized_client',

  /**
   * The Authorization Server was not able to meet the authentication requirements of the Client.
   */
  UnmetAuthenticationRequirements = 'unmet_authentication_requirements',

  /**
   * The Authorization Server does not support the provided Grant Type.
   */
  UnsupportedGrantType = 'unsupported_grant_type',

  /**
   * The Authorization Server does not support the provided Interaction Type.
   */
  UnsupportedInteractionType = 'unsupported_interaction_type',

  /**
   * The Http Header **Content-Type** is not valid for the Endpoint.
   */
  UnsupportedMediaType = 'unsupported_media_type',

  /**
   * The Authorization Server does not support the provided Response Type.
   */
  UnsupportedResponseType = 'unsupported_response_type',

  /**
   * The Authorization Server does not support the provided Token Type.
   */
  UnsupportedTokenType = 'unsupported_token_type',
}
