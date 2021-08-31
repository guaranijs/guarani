export interface SettingsParams {
  readonly issuer: string
}

export class Settings {
  public readonly issuer: string
  public readonly rotateRefreshToken: boolean

  public constructor(params: SettingsParams) {
    this.issuer = params.issuer
  }
}
