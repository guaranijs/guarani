import { InteractionContext } from '../../context/interaction/interaction-context';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { InteractionRequest } from '../../requests/interaction/interaction-request';

/**
 * Implementation of the Interaction Request Validator.
 */
export abstract class InteractionRequestValidator<
  TContextContext extends InteractionContext = InteractionContext,
  TDecisionContext extends InteractionContext = InteractionContext,
> {
  /**
   * Name of the Interaction Type that uses this Validator.
   */
  public abstract readonly name: InteractionType;

  /**
   * Instantiates a new Interaction Request Validator.
   *
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(protected readonly interactionTypes: InteractionTypeInterface[]) {}

  /**
   * Validates the Http Context Interaction Request and returns the actors of the Context Interaction Context.
   *
   * @param request Http Request.
   * @returns Context Interaction Context.
   */
  public async validateContext(request: HttpRequest): Promise<TContextContext> {
    const parameters = request.query as InteractionRequest;

    const interactionType = this.getInteractionType(parameters);

    return <TContextContext>{ parameters, interactionType };
  }

  /**
   * Validates the Http Decision Interaction Request and returns the actors of the Decision Interaction Context.
   *
   * @param request Http Request.
   * @returns Decision Interaction Context.
   */
  public async validateDecision(request: HttpRequest): Promise<TDecisionContext> {
    const parameters = request.form<InteractionRequest>();

    const interactionType = this.getInteractionType(parameters);

    return <TDecisionContext>{ parameters, interactionType };
  }

  /**
   * Retrieves the Interaction Type requested by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Interaction Type.
   */
  private getInteractionType(parameters: InteractionRequest): InteractionTypeInterface {
    return this.interactionTypes.find((interactionType) => interactionType.name === parameters.interaction_type)!;
  }
}
