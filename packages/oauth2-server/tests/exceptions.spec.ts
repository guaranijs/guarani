import { Dict, Optional } from '@guarani/types';

import { OAuth2Exception } from '../lib/exceptions/oauth2.exception';
import { OAuth2ExceptionParams } from '../lib/exceptions/oauth2.exception.params';
import { SupportedOAuth2Error } from '../lib/exceptions/types/supported-oauth2-errors';

const methodsToErrorCodes: [(params?: Optional<Dict>) => OAuth2Exception, SupportedOAuth2Error, Dict][] = [
  [OAuth2Exception.AccessDenied, 'access_denied', { statusCode: 400 }],
  [OAuth2Exception.InvalidClient, 'invalid_client', { statusCode: 401 }],
  [OAuth2Exception.InvalidGrant, 'invalid_grant', { statusCode: 400 }],
  [OAuth2Exception.InvalidRequest, 'invalid_request', { statusCode: 400 }],
  [OAuth2Exception.InvalidScope, 'invalid_scope', { statusCode: 400 }],
  [OAuth2Exception.ServerError, 'server_error', { statusCode: 500 }],
  [OAuth2Exception.TemporarilyUnavailable, 'temporarily_unavailable', { statusCode: 503 }],
  [OAuth2Exception.UnauthorizedClient, 'unauthorized_client', { statusCode: 400 }],
  [OAuth2Exception.UnsupportedGrantType, 'unsupported_grant_type', { statusCode: 400 }],
  [OAuth2Exception.UnsupportedResponseType, 'unsupported_response_type', { statusCode: 400 }],
];

describe('OAuth 2.0 Exceptions', () => {
  it.each(methodsToErrorCodes)('should instantiate an OAuth 2.0 Exception.', (method, errorCode, excHttp) => {
    const exc = method();

    expect(exc).toMatchObject(excHttp);
    expect(exc.toJSON()).toMatchObject<OAuth2ExceptionParams>({ error: errorCode });
  });
});
