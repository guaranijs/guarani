import { Injectable } from '@guarani/di';

import { randomBytes, randomUUID } from 'crypto';

import { Client } from '../../entities/client.entity';
import { LogoutTicket } from '../../entities/logout-ticket.entity';
import { Session } from '../../entities/session.entity';
import { EndSessionRequest } from '../../requests/end-session-request';
import { LogoutTicketServiceInterface } from '../logout-ticket.service.interface';

@Injectable()
export class LogoutTicketService implements LogoutTicketServiceInterface {
  private readonly logoutTickets: LogoutTicket[] = [];

  public constructor() {
    console.warn('Using default Logout Ticket Service. This is only recommended for development.');
  }

  public async create(parameters: EndSessionRequest, client: Client, session: Session): Promise<LogoutTicket> {
    const logoutTicket: LogoutTicket = {
      id: randomUUID(),
      logoutChallenge: randomBytes(16).toString('hex'),
      parameters,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 300000),
      client,
      session,
    };

    this.logoutTickets.push(logoutTicket);

    return logoutTicket;
  }

  public async findOne(id: string): Promise<LogoutTicket | null> {
    return this.logoutTickets.find((logoutTicket) => logoutTicket.id === id) ?? null;
  }

  public async findOneByLogoutChallenge(logoutChallenge: string): Promise<LogoutTicket | null> {
    return this.logoutTickets.find((logoutTicket) => logoutTicket.logoutChallenge === logoutChallenge) ?? null;
  }

  public async save(logoutTicket: LogoutTicket): Promise<void> {
    const index = this.logoutTickets.findIndex((savedLogoutTicket) => savedLogoutTicket.id === logoutTicket.id);

    if (index > -1) {
      this.logoutTickets[index] = logoutTicket;
    }
  }

  public async remove(logoutTicket: LogoutTicket): Promise<void> {
    const index = this.logoutTickets.findIndex((savedLogoutTicket) => savedLogoutTicket.id === logoutTicket.id);

    if (index > -1) {
      this.logoutTickets.splice(index, 1);
    }
  }
}
