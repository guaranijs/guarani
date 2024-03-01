import { Inject, Injectable, InjectAll } from '@guarani/di';

import { CreateContextInteractionContext } from '../../context/interaction/create-context.interaction-context';
import { CreateDecisionInteractionContext } from '../../context/interaction/create-decision.interaction-context';
import { Grant } from '../../entities/grant.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { Logger } from '../../logger/logger';
import { CreateContextInteractionRequest } from '../../requests/interaction/create-context.interaction-request';
import { CreateDecisionInteractionRequest } from '../../requests/interaction/create-decision.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { InteractionRequestValidator } from './interaction-request.validator';

/**
 * Implementation of the Create Interaction Request Validator.
 */
@Injectable()
export class CreateInteractionRequestValidator extends InteractionRequestValidator<
  CreateContextInteractionContext,
  CreateDecisionInteractionContext
> {
  /**
   * Name of the Interaction Type that uses this Validator.
   */
  public readonly name: InteractionType = 'create';

  /**
   * Instantiates a new Create Interaction Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @InjectAll(INTERACTION_TYPE) protected override readonly interactionTypes: InteractionTypeInterface[],
  ) {
    super(logger, interactionTypes);
  }

  /**
   * Validates the Http Context Interaction Request and returns the actors of the Context Interaction Context.
   *
   * @param request Http Request.
   * @returns Context Interaction Context.
   */
  public override async validateContext(request: HttpRequest): Promise<CreateContextInteractionContext> {
    this.logger.debug(`[${this.constructor.name}] Called validateContext()`, '887f474a-b16f-4d8e-8844-59a752898cef', {
      request,
    });

    const context = await super.validateContext(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);

    Object.assign<CreateContextInteractionContext, Partial<CreateContextInteractionContext>>(context, { grant });

    this.logger.debug(
      `[${this.constructor.name}] Create Interaction Request Context validation completed`,
      '34a37dc6-b4be-4ad6-97d6-addab7fe0144',
      { context },
    );

    return context;
  }

  /**
   * Validates the Http Decision Interaction Request and returns the actors of the Decision Interaction Context.
   *
   * @param request Http Request.
   * @returns Decision Interaction Context.
   */
  public override async validateDecision(request: HttpRequest): Promise<CreateDecisionInteractionContext> {
    this.logger.debug(`[${this.constructor.name}] Called validateDecision()`, 'ab32fc37-1ed7-42e8-af0e-efbafb1324b1', {
      request,
    });

    const context = await super.validateDecision(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);

    Object.assign<CreateDecisionInteractionContext, Partial<CreateDecisionInteractionContext>>(context, { grant });

    this.logger.debug(
      `[${this.constructor.name}] Create Interaction Request Decision validation completed`,
      '1ef54540-64da-458f-a89d-cfc4659e4078',
      { context },
    );

    return context;
  }

  /**
   * Fetches the requested Grant from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Grant based on the provided Login Challenge.
   */
  private async getGrant(
    parameters: CreateContextInteractionRequest | CreateDecisionInteractionRequest,
  ): Promise<Grant> {
    this.logger.debug(`[${this.constructor.name}] Called getGrant()`, '518977a7-6d6c-46bf-99f8-91128f22f814', {
      parameters,
    });

    if (typeof parameters.login_challenge === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "login_challenge".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "login_challenge"`,
        '7393fbba-a902-4390-944c-c2b0362ab9fc',
        { parameters },
        exc,
      );

      throw exc;
    }

    const grant = await this.grantService.findOneByLoginChallenge(parameters.login_challenge);

    if (grant === null) {
      const exc = new AccessDeniedException('Invalid Login Challenge.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Login Challenge`,
        'bee05d5a-faf2-43ad-9dc6-c41280e198bb',
        null,
        exc,
      );

      throw exc;
    }

    return grant;
  }
}
