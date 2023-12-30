import { DataSource } from 'typeorm';

import { AccessToken } from './app/entities/access-token.entity';
import { Address } from './app/entities/address.entity';
import { AuthorizationCode } from './app/entities/authorization-code.entity';
import { Client } from './app/entities/client.entity';
import { Consent } from './app/entities/consent.entity';
import { DeviceCode } from './app/entities/device-code.entity';
import { Grant } from './app/entities/grant.entity';
import { Login } from './app/entities/login.entity';
import { LogoutTicket } from './app/entities/logout-ticket.entity';
import { RefreshToken } from './app/entities/refresh-token.entity';
import { Session } from './app/entities/session.entity';
import { User } from './app/entities/user.entity';
import { dataSourceOptions } from './data-source.options';

export const dataSource = new DataSource({
  ...dataSourceOptions,
  entities: [
    AccessToken,
    Address,
    AuthorizationCode,
    Client,
    Consent,
    DeviceCode,
    Grant,
    Login,
    LogoutTicket,
    RefreshToken,
    Session,
    User,
  ],
});

export const AppDataSource = dataSource;

export default dataSource;
