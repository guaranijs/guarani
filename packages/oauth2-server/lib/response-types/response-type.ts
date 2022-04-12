import { Injectable } from '@guarani/ioc';
import { Dict } from '@guarani/types';

import { ClientEntity } from '../entities/client.entity';
import { UserEntity } from '../entities/user.entity';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { Request } from '../http/request';
import { SupportedResponseMode } from '../response-modes/types/supported-response-mode';
import { SupportedResponseType } from './types/supported-response-type';

/**
 * Abstract Base Class for the Response Types supported by Guarani.
 */
@Injectable()
export abstract class ResponseType {
  /**
   * Name of the Response Type.
   */
  public abstract readonly name: SupportedResponseType;

  /**
   * Default Response Mode of the Response Type.
   */
  public abstract readonly defaultResponseMode: SupportedResponseMode;

  /**
   * Creates the Authorization Response with the Authorization Granted used by the Client on behalf of the End User.
   *
   * @param request HTTP Request.
   * @param client OAuth 2.0 Client of the Request.
   * @param user End User represented by the Client.
   * @returns Authorization Response.
   */
  public abstract createAuthorizationResponse(request: Request, client: ClientEntity, user: UserEntity): Promise<Dict>;

  /**
   * Checks if the Client is allowed to request the provided Scope and, if so,
   * returns a list of the Allowed Scopes from the OAuth 2.0 Request.
   *
   * @param client OAuth 2.0 Client of the Request.
   * @param scope Scope requested by the Client.
   * @returns List of allowed Scopes.
   */
  protected getAllowedScopes(client: ClientEntity, scope: string): string[] {
    const requestedScopes = scope.split(' ');

    requestedScopes.forEach((requestedScope) => {
      if (!client.scopes.includes(requestedScope)) {
        throw new InvalidScopeException({
          error_description: `This Client is not allowed to request the scope "${requestedScope}".`,
        });
      }
    });

    return requestedScopes;
  }
}
