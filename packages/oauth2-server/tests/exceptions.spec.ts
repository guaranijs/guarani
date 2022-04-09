import { Dict, Optional } from '@guarani/types';

import { OAuth2Exception } from '../lib/exceptions/oauth2.exception';
import { OAuth2ExceptionParams } from '../lib/exceptions/oauth2.exception.params';
import { SupportedOAuth2Error } from '../lib/exceptions/types/supported-oauth2-errors';

const methodsToErrorCodes: [(params?: Optional<Dict>) => OAuth2Exception, SupportedOAuth2Error][] = [
  [OAuth2Exception.AccessDenied, 'access_denied'],
  [OAuth2Exception.InvalidClient, 'invalid_client'],
  [OAuth2Exception.InvalidGrant, 'invalid_grant'],
  [OAuth2Exception.InvalidRequest, 'invalid_request'],
  [OAuth2Exception.InvalidScope, 'invalid_scope'],
  [OAuth2Exception.ServerError, 'server_error'],
  [OAuth2Exception.TemporarilyUnavailable, 'temporarily_unavailable'],
  [OAuth2Exception.UnauthorizedClient, 'unauthorized_client'],
  [OAuth2Exception.UnsupportedGrantType, 'unsupported_grant_type'],
  [OAuth2Exception.UnsupportedResponseType, 'unsupported_response_type'],
];

describe('OAuth 2.0 Exceptions', () => {
  it.each(methodsToErrorCodes)('should instantiate an OAuth 2.0 Exception.', (method, errorCode) => {
    expect(method().toJSON()).toMatchObject<OAuth2ExceptionParams>({ error: errorCode });
  });
});
