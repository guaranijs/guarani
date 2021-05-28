import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm'

import { OAuth2Client } from '../../lib'

const transformer = {
  from: (value: any) => JSON.parse(value),
  to: (value: any) => JSON.stringify(value)
}

@Entity({ name: 'clients' })
export class Client extends BaseEntity implements OAuth2Client {
  @PrimaryColumn({ name: 'id', type: 'uuid' })
  public readonly id: string

  @Column({ name: 'secret', type: 'varchar', length: 64, nullable: true })
  public secret?: string

  @Column({ name: 'name', type: 'varchar', length: 32 })
  public name: string

  @Column({ name: 'redirect_uris', type: 'text', transformer })
  public redirect_uris: string[]

  @Column({ name: 'scopes', type: 'text', transformer })
  public scopes: string[]

  @Column({ name: 'token_endpoint_auth_method', type: 'varchar', length: 80 })
  public token_endpoint_auth_method: string

  @Column({ name: 'grant_types', type: 'text', transformer })
  public grant_types: string[]

  @Column({ name: 'response_types', type: 'text', transformer })
  public response_types: string[]

  public getId(): string {
    return this.id
  }

  public async checkSecret(secret: string): Promise<boolean> {
    return this.secret === secret
  }

  public getName(): string {
    return this.name
  }

  public checkRedirectUri(redirectUri: string): boolean {
    return this.redirect_uris.includes(redirectUri)
  }

  public checkScope(scope: string): string[] {
    const scopes = scope.split(' ')
    return scopes.every(scope => this.scopes.includes(scope)) ? scopes : null
  }

  public checkTokenEndpointAuthMethod(method: string): boolean {
    return this.token_endpoint_auth_method === method
  }

  public checkGrantType(grantType: string): boolean {
    return this.grant_types.includes(grantType)
  }

  public checkResponseType(responseType: string): boolean {
    return this.response_types.includes(responseType)
  }
}
