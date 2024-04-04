import { Dictionary, Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Device Code Entity.
 */
export abstract class DeviceCode implements Dictionary<any> {
  /**
   * Identifier of the Device Code.
   */
  public readonly id!: string;

  /**
   * Shorthand identifier of the Device Code that the user will present at the Device Endpoint.
   *
   * *note: this need **not** be an actual substring of the device code.*
   */
  public readonly userCode!: string;

  /**
   * Scopes requested by the Client.
   */
  public readonly scopes!: string[];

  /**
   * Authorization status of the Device Code.
   */
  public isAuthorized!: Nullable<boolean>;

  /**
   * Issuance Date of the Device Code.
   */
  public readonly issuedAt!: Date;

  /**
   * Expiration Date of the Device Code.
   */
  public readonly expiresAt!: Date;

  /**
   * Client requesting authorization.
   */
  public readonly client!: Client;

  /**
   * Authenticated User that decided on the Device Code.
   *
   * *note: once the device code is authorized, this attribute **must** be set.*
   */
  public user!: Nullable<User>;

  /**
   * Additional Device Code Parameters.
   */
  [parameter: string]: unknown;

  /**
   * Expiration status of the Device Code.
   */
  public get isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }
}
