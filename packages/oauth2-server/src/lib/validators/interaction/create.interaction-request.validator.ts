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
   * @param grantService Instance of the Grant Service.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @InjectAll(INTERACTION_TYPE) protected override readonly interactionTypes: InteractionTypeInterface[]
  ) {
    super(interactionTypes);
  }

  /**
   * Validates the Http Context Interaction Request and returns the actors of the Context Interaction Context.
   *
   * @param request Http Request.
   * @returns Context Interaction Context.
   */
  public override async validateContext(request: HttpRequest): Promise<CreateContextInteractionContext> {
    const context = await super.validateContext(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);

    return Object.assign(context, { grant }) as CreateContextInteractionContext;
  }

  /**
   * Validates the Http Decision Interaction Request and returns the actors of the Decision Interaction Context.
   *
   * @param request Http Request.
   * @returns Decision Interaction Context.
   */
  public override async validateDecision(request: HttpRequest): Promise<CreateDecisionInteractionContext> {
    const context = await super.validateDecision(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);

    return Object.assign(context, { grant }) as CreateDecisionInteractionContext;
  }

  /**
   * Fetches the requested Grant from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Grant based on the provided Login Challenge.
   */
  private async getGrant(
    parameters: CreateContextInteractionRequest | CreateDecisionInteractionRequest
  ): Promise<Grant> {
    if (typeof parameters.login_challenge === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "login_challenge".');
    }

    const grant = await this.grantService.findOneByLoginChallenge(parameters.login_challenge);

    if (grant === null) {
      throw new AccessDeniedException('Invalid Login Challenge.');
    }

    return grant;
  }
}
