import { DependencyInjectionContainer } from '@guarani/di';

import { LogoutContextInteractionContext } from '../context/interaction/logout-context.interaction-context';
import { LogoutDecisionInteractionContext } from '../context/interaction/logout-decision.interaction-context';
import { LogoutDecisionAcceptInteractionContext } from '../context/interaction/logout-decision-accept.interaction-context';
import { LogoutDecisionDenyInteractionContext } from '../context/interaction/logout-decision-deny.interaction-context';
import { Login } from '../entities/login.entity';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { Session } from '../entities/session.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { LogoutTypeInterface } from '../logout-types/logout-type.interface';
import { LogoutContextInteractionResponse } from '../responses/interaction/logout-context.interaction-response';
import { LogoutDecisionInteractionResponse } from '../responses/interaction/logout-decision.interaction-response';
import { LogoutTicketServiceInterface } from '../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../services/logout-ticket.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';
import { LogoutInteractionType } from './logout.interaction-type';
import { LogoutDecision } from './logout-decision.type';

jest.mock('../handlers/auth.handler');

describe('Logout Interaction Type', () => {
  let container: DependencyInjectionContainer;
  let interactionType: LogoutInteractionType;

  const settings = <Settings>{ issuer: 'https://server.example.com' };

  const logoutTicketServiceMock = jest.mocked<LogoutTicketServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByLogoutChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<LogoutTicketServiceInterface>(LOGOUT_TICKET_SERVICE).toValue(logoutTicketServiceMock);
    container.bind(LogoutInteractionType).toSelf().asSingleton();

    interactionType = container.resolve(LogoutInteractionType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "logout" as its name.', () => {
      expect(interactionType.name).toEqual<InteractionType>('logout');
    });
  });

  describe('handleContext()', () => {
    let context: LogoutContextInteractionContext;

    beforeEach(() => {
      const now = Date.now();

      context = <LogoutContextInteractionContext>{
        parameters: {
          interaction_type: 'logout',
          logout_challenge: 'logout_challenge',
        },
        interactionType: <InteractionTypeInterface>{
          name: 'logout',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        },
        logoutTicket: <LogoutTicket>{
          id: 'logout_ticket_id',
          logoutChallenge: 'logout_challenge',
          parameters: {
            id_token_hint: 'id_token_hint',
            client_id: 'client_id',
            post_logout_redirect_uri: 'https://client.example.com/oauth/logout-callback',
            state: 'client_state',
            logout_hint: 'johndoe@email.com',
            ui_locales: 'pt-BR en',
          },
          createdAt: new Date(now),
          expiresAt: new Date(now + 300000),
          client: { id: 'client_id' },
          session: {
            id: 'session_id',
            activeLogin: { id: 'login1_id' },
            logins: [{ id: 'login0_id' }, { id: 'login1_id' }, { id: 'login2_id' }],
          },
        },
      };
    });

    it('should throw when the logout ticket is expired.', async () => {
      Reflect.set(context.logoutTicket, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleContext(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Logout Ticket.',
      );

      expect(logoutTicketServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(logoutTicketServiceMock.remove).toHaveBeenCalledWith(context.logoutTicket);
    });

    it('should return a valid first time logout context response.', async () => {
      const requestUrl = addParametersToUrl(
        'https://server.example.com/oauth/end_session',
        context.logoutTicket.parameters,
      );

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<LogoutContextInteractionResponse>({
        skip: false,
        request_url: requestUrl.href,
        client: 'client_id',
        context: {
          logout_hint: 'johndoe@email.com',
          ui_locales: ['pt-BR', 'en'],
        },
      });
    });

    it('should return a valid skip logout context response.', async () => {
      context.logoutTicket.session.activeLogin = null;

      const requestUrl = addParametersToUrl(
        'https://server.example.com/oauth/end_session',
        context.logoutTicket.parameters,
      );

      await expect(interactionType.handleContext(context)).resolves.toStrictEqual<LogoutContextInteractionResponse>({
        skip: true,
        request_url: requestUrl.href,
        client: 'client_id',
        context: {
          logout_hint: 'johndoe@email.com',
          ui_locales: ['pt-BR', 'en'],
        },
      });
    });
  });

  describe('handleDecision()', () => {
    let context: LogoutDecisionInteractionContext<LogoutDecision>;

    beforeEach(() => {
      const now = Date.now();

      context = <LogoutDecisionInteractionContext>{
        parameters: {
          interaction_type: 'logout',
          logout_challenge: 'logout_challenge',
        },
        interactionType: <InteractionTypeInterface>{
          name: 'logout',
          handleContext: jest.fn(),
          handleDecision: jest.fn(),
        },
        logoutTicket: <LogoutTicket>{
          id: 'logout_ticket_id',
          logoutChallenge: 'logout_challenge',
          parameters: {
            id_token_hint: 'id_token_hint',
            client_id: 'client_id',
            post_logout_redirect_uri: 'https://client.example.com/oauth/logout-callback',
            state: 'client_state',
            logout_hint: 'johndoe@email.com',
            ui_locales: 'pt-BR en',
          },
          createdAt: new Date(now),
          expiresAt: new Date(now + 300000),
          client: { id: 'client_id' },
          session: {
            id: 'session_id',
            activeLogin: { id: 'login1_id' },
            logins: [{ id: 'login0_id' }, { id: 'login1_id' }, { id: 'login2_id' }],
          },
        },
      };
    });

    it('should throw when the logout ticket is expired.', async () => {
      Reflect.set(context.logoutTicket, 'expiresAt', new Date(Date.now() - 3600000));

      await expect(interactionType.handleDecision(context)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Expired Logout Ticket.',
      );

      expect(logoutTicketServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(logoutTicketServiceMock.remove).toHaveBeenCalledWith(context.logoutTicket);
    });

    // #region Accept Decision
    it('should return a valid first time logout accept decision interaction response.', async () => {
      Reflect.set(context.parameters, 'decision', 'accept');

      Object.assign(context, {
        decision: 'accept',
        session: <Session>{
          id: 'session_id',
          activeLogin: { id: 'login1_id' },
          logins: [{ id: 'login0_id' }, { id: 'login1_id' }, { id: 'login2_id' }],
        },
        logoutType: jest.mocked<LogoutTypeInterface>({
          name: 'local',
          logout: jest.fn(),
        }),
      });

      const redirectTo = addParametersToUrl(
        'https://server.example.com/oauth/end_session',
        context.logoutTicket.parameters,
      );

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LogoutDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      const { session } = context as LogoutDecisionAcceptInteractionContext;

      expect((<LogoutDecisionAcceptInteractionContext>context).logoutType.logout).toHaveBeenCalledTimes(1);
      expect((<LogoutDecisionAcceptInteractionContext>context).logoutType.logout).toHaveBeenCalledWith(
        context.logoutTicket,
      );

      expect(logoutTicketServiceMock.save).toHaveBeenCalledTimes(1);
      expect(logoutTicketServiceMock.save).toHaveBeenCalledWith(<LogoutTicket>{ ...context.logoutTicket, session });

      const logoutOrder = (<jest.MockedObjectDeep<LogoutDecisionAcceptInteractionContext>>context).logoutType.logout
        .mock.invocationCallOrder[0]!;

      const saveLogoutTicketOrder = logoutTicketServiceMock.save.mock.invocationCallOrder[0]!;

      expect(logoutOrder).toBeLessThan(saveLogoutTicketOrder);
    });

    it('should return a valid subsequent logout accept decision interaction response.', async () => {
      Reflect.set(context.parameters, 'decision', 'accept');

      Object.assign(context, {
        decision: 'accept',
        session: <Session>{
          id: 'session_id',
          activeLogin: null,
          logins: [{ id: 'login0_id' }, { id: 'login2_id' }],
        },
        logoutType: jest.mocked<LogoutTypeInterface>({
          name: 'local',
          logout: jest.fn(),
        }),
      });

      context.logoutTicket.session.activeLogin = null;
      context.logoutTicket.session.logins = <Login[]>[{ id: 'login0_id' }, { id: 'login2_id' }];

      const redirectTo = addParametersToUrl(
        'https://server.example.com/oauth/end_session',
        context.logoutTicket.parameters,
      );

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LogoutDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect((<LogoutDecisionAcceptInteractionContext>context).logoutType.logout).not.toHaveBeenCalled();
      expect(logoutTicketServiceMock.save).not.toHaveBeenCalled();
    });
    // #endregion

    // #region Deny Decision
    it('should return a valid logout deny decision interaction response.', async () => {
      Object.assign(context, {
        parameters: Object.assign(context.parameters, {
          decision: 'deny',
          error: 'logout_denied',
          error_description: 'Lorem ipsum dolor sit amet...',
        }),
        decision: 'deny',
        error: Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
          Reflect.construct(OAuth2Exception, [context.parameters.error_description as string]),
          { error: context.parameters.error as string },
        ),
      });

      const { error } = context as LogoutDecisionDenyInteractionContext;

      const redirectTo = addParametersToUrl('https://server.example.com/oauth/error', error.toJSON());

      await expect(interactionType.handleDecision(context)).resolves.toStrictEqual<LogoutDecisionInteractionResponse>({
        redirect_to: redirectTo.href,
      });

      expect(logoutTicketServiceMock.remove).toHaveBeenCalledTimes(1);
      expect(logoutTicketServiceMock.remove).toHaveBeenCalledWith(context.logoutTicket);
    });
    // #endregion
  });
});
