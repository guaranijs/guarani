import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

/**
 * Interface of the Refresh Token Service.
 *
 * The Refresh Token Service contains the operations regarding the OAuth 2.0 Refresh Token.
 */
export interface RefreshTokenServiceInterface {
  /**
   * Creates a Refresh Token for reissuing Access Tokens for authorized use by the Client on behalf of the End-User.
   *
   * @param scopes Scopes granted to the Client.
   * @param client Client requesting authorization.
   * @param user End-User that granted authorization.
   * @param accessToken Access Token issued to the Client.
   * @returns Issued Refresh Token.
   */
  create(scopes: string[], client: Client, user: User, accessToken: AccessToken): Promise<RefreshToken>;

  /**
   * Searches the application's storage for a Refresh Token containing the provided Handle.
   *
   * @param handle Handle of the Refresh Token.
   * @returns Refresh Token based on the provided Handle.
   */
  findOne(handle: string): Promise<RefreshToken | null>;

  /**
   * Revokes the provided Refresh Token.
   *
   * @param refreshToken Refresh Token to be revoked.
   */
  revoke(refreshToken: RefreshToken): Promise<void>;

  /**
   * Rotates the Refresh Token by creating a new Refresh Token with the same metadata and different handle,
   * and revoking the old refresh token used to refresh the Access Token.
   *
   * *note: this method is only required when supporting **refresh token rotation**.*
   *
   * @param refreshToken Refresh Token provided by the Client.
   * @returns Rotated Refresh Token with the same metadata as the revoked one.
   */
  rotate?(refreshToken: RefreshToken): Promise<RefreshToken>;
}
