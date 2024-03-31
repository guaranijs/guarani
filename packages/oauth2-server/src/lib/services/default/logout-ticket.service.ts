import { randomBytes, randomUUID } from 'crypto';

import { Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../../entities/client.entity';
import { LogoutTicket } from '../../entities/logout-ticket.entity';
import { Session } from '../../entities/session.entity';
import { Logger } from '../../logger/logger';
import { EndSessionRequest } from '../../requests/end-session-request';
import { LogoutTicketServiceInterface } from '../logout-ticket.service.interface';

@Injectable()
export class LogoutTicketService implements LogoutTicketServiceInterface {
  private readonly logoutTickets: LogoutTicket[] = [];

  public constructor(protected readonly logger: Logger) {
    this.logger.warning(
      `[${this.constructor.name}] Using default Logout Ticket Service. This is only recommended for development.`,
      '36378c52-17b6-409e-bf72-b5c05af8db2b',
    );
  }

  public async create(parameters: EndSessionRequest, client: Client, session: Session): Promise<LogoutTicket> {
    this.logger.debug(`[${this.constructor.name}] Called create()`, 'eb2dd200-7ed8-4503-abf5-44ab6235afac', {
      parameters,
      client,
      session,
    });

    const logoutTicket: LogoutTicket = Object.assign<LogoutTicket, Partial<LogoutTicket>>(
      Reflect.construct(LogoutTicket, []),
      {
        id: randomUUID(),
        logoutChallenge: randomBytes(16).toString('hex'),
        parameters,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        client,
        session,
      },
    );

    this.logoutTickets.push(logoutTicket);

    return logoutTicket;
  }

  public async findOne(id: string): Promise<Nullable<LogoutTicket>> {
    this.logger.debug(`[${this.constructor.name}] Called findOne()`, '2dc100d7-5a68-4d5e-b8ee-4e99f7e67487', { id });
    return this.logoutTickets.find((logoutTicket) => logoutTicket.id === id) ?? null;
  }

  public async findOneByLogoutChallenge(logoutChallenge: string): Promise<Nullable<LogoutTicket>> {
    this.logger.debug(
      `[${this.constructor.name}] Called findOneByLogoutChallenge()`,
      '9e83dec1-7704-4172-a59f-fda11164385c',
      { logout_challenge: logoutChallenge },
    );

    return this.logoutTickets.find((logoutTicket) => logoutTicket.logoutChallenge === logoutChallenge) ?? null;
  }

  public async save(logoutTicket: LogoutTicket): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called save()`, '0660fbe1-bd5b-40c6-9ded-5b279d0bf4d3', {
      logout_ticket: logoutTicket,
    });

    const index = this.logoutTickets.findIndex((savedLogoutTicket) => savedLogoutTicket.id === logoutTicket.id);

    if (index > -1) {
      this.logoutTickets[index] = logoutTicket;
    }
  }

  public async remove(logoutTicket: LogoutTicket): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called remove()`, '9dc733f0-4c50-411d-8bff-8ffdcca51c25', {
      logout_ticket: logoutTicket,
    });

    const index = this.logoutTickets.findIndex((savedLogoutTicket) => savedLogoutTicket.id === logoutTicket.id);

    if (index > -1) {
      this.logoutTickets.splice(index, 1);
    }
  }
}
