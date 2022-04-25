import { getContainer } from '@guarani/ioc';
import { removeNullishValues } from '@guarani/objects';

import { AccessToken } from './entities/access-token';
import { Client } from './entities/client';
import { InvalidScopeException } from './exceptions/invalid-scope.exception';
import { AccessTokenResponse } from './types/access-token.response';

/**
 * Checks if the Client is allowed to request the provided Scope and, if so,
 * returns a list of the Allowed Scopes from the OAuth 2.0 Request.
 *
 * @param client OAuth 2.0 Client of the Request.
 * @param scope Scope requested by the Client.
 * @returns List of allowed Scopes.
 */
export function checkRequestedScope(client: Client, scope: string): string[] {
  const registeredScopes = getContainer('oauth2').resolve<string[]>('Scopes');
  const requestedScopes = scope.split(' ');

  requestedScopes.forEach((requestedScope) => {
    if (!registeredScopes.includes(requestedScope)) {
      throw new InvalidScopeException({ error_description: `Unsupported scope "${requestedScope}".` });
    }

    if (!client.scopes.includes(requestedScope)) {
      throw new InvalidScopeException({
        error_description: `This Client is not allowed to request the scope "${requestedScope}".`,
      });
    }
  });

  return requestedScopes;
}

/**
 * Returns a structured Access Token Response to the Client based on the provided Access Token.
 *
 * @param accessToken Access Token issued to the Client.
 * @returns Access Token Response.
 */
export function createAccessTokenResponse(accessToken: AccessToken): AccessTokenResponse {
  return removeNullishValues<AccessTokenResponse>({
    access_token: accessToken.token,
    token_type: accessToken.tokenType,
    expires_in: Math.ceil((accessToken.expiresAt.getTime() - Date.now()) / 1000),
    scope: accessToken.scopes.join(' '),
    refresh_token: accessToken.refreshToken?.token,
  });
}
