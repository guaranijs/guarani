import {
  ClientEntity as BaseClientEntity,
  SupportedClientAuthentication,
  SupportedGrantType,
  SupportedResponseType,
} from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { URL } from 'url';

@Entity({ name: 'clients' })
export class ClientEntity extends BaseEntity implements BaseClientEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'client_id' })
  public readonly id!: string;

  @Column({ name: 'client_secret', type: 'varchar', length: 32, nullable: true, unique: true })
  public secret?: Optional<string>;

  @Column({
    name: 'redirect_uris',
    type: 'text',
    transformer: {
      from: (data: string): URL[] => (<string[]>JSON.parse(data)).map((redirectUri) => new URL(redirectUri)),
      to: (data: URL[]): string => JSON.stringify(data.map((redirectUri) => redirectUri.href)),
    },
  })
  public redirectUris!: URL[];

  @Column({ name: 'authentication_method', type: 'varchar' })
  public authenticationMethod!: SupportedClientAuthentication;

  @Column({
    name: 'grant_types',
    type: 'text',
    transformer: {
      from: (data: string): SupportedGrantType[] => JSON.parse(data),
      to: (data: SupportedGrantType[]): string => JSON.stringify(data),
    },
  })
  public grantTypes!: SupportedGrantType[];

  @Column({
    name: 'response_types',
    type: 'text',
    transformer: {
      from: (data: string): SupportedResponseType[] => JSON.parse(data),
      to: (data: SupportedResponseType[]): string => JSON.stringify(data),
    },
  })
  public responseTypes!: SupportedResponseType[];

  @Column({
    name: 'scopes',
    type: 'text',
    transformer: {
      from: (data: string): string[] => JSON.parse(data),
      to: (data: string[]): string => JSON.stringify(data),
    },
  })
  public scopes!: string[];
}
