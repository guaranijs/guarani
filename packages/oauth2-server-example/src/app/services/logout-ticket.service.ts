import { randomBytes } from 'crypto';
import { promisify } from 'util';

import { Injectable } from '@guarani/di';
import { EndSessionRequest, LogoutTicketServiceInterface } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { Session } from '../entities/session.entity';

const randomBytesAsync = promisify(randomBytes);

@Injectable()
export class LogoutTicketService implements LogoutTicketServiceInterface {
  public async create(parameters: EndSessionRequest, client: Client, session: Session): Promise<LogoutTicket> {
    const logoutChallengeBuffer = await randomBytesAsync(16);

    const logoutTicket = LogoutTicket.create({
      logoutChallenge: logoutChallengeBuffer.toString('hex'),
      parameters,
      expiresAt: new Date(Date.now() + 1296000000),
      client,
      session,
    });

    await logoutTicket.save();
    return logoutTicket;
  }

  public async findOne(id: string): Promise<Nullable<LogoutTicket>> {
    return await LogoutTicket.findOneBy({ id });
  }

  public async findOneByLogoutChallenge(logoutChallenge: string): Promise<Nullable<LogoutTicket>> {
    return await LogoutTicket.findOneBy({ logoutChallenge });
  }

  public async save(logoutTicket: LogoutTicket): Promise<void> {
    await logoutTicket.save();
  }

  public async remove(logoutTicket: LogoutTicket): Promise<void> {
    await logoutTicket.remove();
  }
}
