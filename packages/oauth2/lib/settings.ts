/**
 * Parameters of the Settings of the Authorization Server.
 */
export interface SettingsParams {
  /**
   * Base URL of the Authorization Server.
   */
  readonly issuer: string
}

/**
 * Settings of the Authorization Server.
 */
export class Settings {
  /**
   * Base URL of the Authorization Server.
   */
  public readonly issuer: string

  /**
   * Instantiates the Settings of the Authorization Server.
   *
   * @param params Parameters of the Settings.
   */
  public constructor(params: SettingsParams) {
    this.issuer = params.issuer
  }
}
