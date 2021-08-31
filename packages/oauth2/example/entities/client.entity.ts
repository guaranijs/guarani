import { secretToken, UUID } from '@guarani/utils'

import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm'

import {
  SupportedApplicationType,
  SupportedClientAuthentication,
  SupportedGrantType,
  SupportedResponseType
} from '../../lib/constants'
import { Client as ClientEntity } from '../../lib/entities'

const transformer = {
  from: (value: any) => JSON.parse(value),
  to: (value: any) => JSON.stringify(value)
}

interface IClient {
  readonly id?: string
  readonly secret?: string
  readonly name: string
  readonly redirectUris: string[]
  readonly scopes: string[]
  readonly authenticationMethod?: SupportedClientAuthentication
  readonly grantTypes?: SupportedGrantType[]
  readonly responseTypes?: SupportedResponseType[]
  readonly applicationType?: SupportedApplicationType
}

@Entity({ name: 'clients' })
export class Client extends BaseEntity implements ClientEntity {
  @PrimaryColumn({ name: 'id', type: 'uuid' })
  public readonly id: string

  @Column({ name: 'secret', type: 'varchar', length: 64, nullable: true })
  public secret?: string

  @Column({ name: 'name', type: 'varchar', length: 32 })
  public name: string

  @Column({ name: 'redirect_uris', type: 'text', transformer })
  public redirectUris: string[]

  @Column({ name: 'scopes', type: 'text', transformer })
  public scopes: string[]

  @Column({ name: 'authentication_method', type: 'varchar', length: 80 })
  public authenticationMethod: SupportedClientAuthentication

  @Column({ name: 'grant_types', type: 'text', transformer })
  public grantTypes: SupportedGrantType[]

  @Column({ name: 'response_types', type: 'text', transformer })
  public responseTypes: SupportedResponseType[]

  @Column({ name: 'application_type', type: 'varchar', length: 32 })
  public applicationType: SupportedApplicationType

  public constructor(data?: IClient) {
    super()

    if (data) {
      this.id = data.id ?? String(new UUID())
      this.secret = data.secret ?? secretToken(64)
      this.name = data.name
      this.redirectUris = data.redirectUris
      this.scopes = data.scopes
      this.authenticationMethod =
        data.authenticationMethod ?? 'client_secret_basic'
      this.grantTypes = data.grantTypes ?? ['authorization_code', 'implicit']
      this.responseTypes = data.responseTypes ?? ['code']
      this.applicationType = data.applicationType ?? 'web'
    }
  }

  public getClientId(): string {
    return this.id
  }

  public async checkSecret(secret: string): Promise<boolean> {
    return this.secret === secret
  }

  public getDefaultRedirectUri(): string {
    return this.redirectUris[0]
  }

  public checkRedirectUri(redirectUri: string): boolean {
    return this.redirectUris.includes(redirectUri)
  }

  public checkScopes(scopes: string[]): boolean {
    return scopes.every(scope => this.scopes.includes(scope))
  }

  public checkAuthenticationMethod(
    method: SupportedClientAuthentication
  ): boolean {
    return this.authenticationMethod === method
  }

  public checkGrantType(grantType: SupportedGrantType): boolean {
    return this.grantTypes.includes(grantType)
  }

  public checkResponseType(responseType: SupportedResponseType): boolean {
    return this.responseTypes.includes(responseType)
  }
}
