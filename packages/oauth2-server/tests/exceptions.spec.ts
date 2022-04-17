import { Constructor, Dict } from '@guarani/types';

import { AccessDeniedException } from '../lib/exceptions/access-denied.exception';
import { InvalidClientException } from '../lib/exceptions/invalid-client.exception';
import { InvalidGrantException } from '../lib/exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../lib/exceptions/invalid-request.exception';
import { InvalidScopeException } from '../lib/exceptions/invalid-scope.exception';
import { OAuth2Exception } from '../lib/exceptions/oauth2.exception';
import { ServerErrorException } from '../lib/exceptions/server-error.exception';
import { TemporarilyUnavailableException } from '../lib/exceptions/temporarily-unavailable.exception';
import { OAuth2ExceptionParams } from '../lib/exceptions/types/oauth2.exception.params';
import { SupportedOAuth2ErrorCode } from '../lib/exceptions/types/supported-oauth2-error-code';
import { UnauthorizedClientException } from '../lib/exceptions/unauthorized-client.exception';
import { UnsupportedGrantTypeException } from '../lib/exceptions/unsupported-grant-type.exception';
import { UnsupportedResponseTypeException } from '../lib/exceptions/unsupported-response-type.exception';

const methodsToErrorCodes: [Constructor<OAuth2Exception>, SupportedOAuth2ErrorCode, Dict][] = [
  [AccessDeniedException, 'access_denied', { statusCode: 400 }],
  [InvalidClientException, 'invalid_client', { statusCode: 401 }],
  [InvalidGrantException, 'invalid_grant', { statusCode: 400 }],
  [InvalidRequestException, 'invalid_request', { statusCode: 400 }],
  [InvalidScopeException, 'invalid_scope', { statusCode: 400 }],
  [ServerErrorException, 'server_error', { statusCode: 500 }],
  [TemporarilyUnavailableException, 'temporarily_unavailable', { statusCode: 503 }],
  [UnauthorizedClientException, 'unauthorized_client', { statusCode: 400 }],
  [UnsupportedGrantTypeException, 'unsupported_grant_type', { statusCode: 400 }],
  [UnsupportedResponseTypeException, 'unsupported_response_type', { statusCode: 400 }],
];

describe('OAuth 2.0 Exceptions', () => {
  it.each(methodsToErrorCodes)('should instantiate an OAuth 2.0 Exception.', (constructor, errorCode, excHttp) => {
    const exc = new constructor();

    expect(exc).toMatchObject(excHttp);
    expect(exc.toJSON()).toMatchObject<OAuth2ExceptionParams>({ error: errorCode });
  });
});
