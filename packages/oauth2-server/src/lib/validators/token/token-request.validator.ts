import { TokenContext } from '../../context/token/token-context';
import { Client } from '../../entities/client.entity';
import { UnauthorizedClientException } from '../../exceptions/unauthorized-client.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { TokenRequest } from '../../requests/token/token-request';

/**
 * Implementation of the Token Request Validator.
 */
export abstract class TokenRequestValidator<TContext extends TokenContext = TokenContext> {
  /**
   * Name of the Grant Type that uses this Validator.
   */
  public abstract readonly name: GrantType;

  /**
   * Instantiates a new Token Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected readonly logger: Logger,
    protected readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    protected readonly grantTypes: GrantTypeInterface[],
  ) {}

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public async validate(request: HttpRequest): Promise<TContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, 'f12ae6fa-0119-4bdd-bd34-33de4590b606', {
      request,
    });

    const parameters = request.form<TokenRequest>();

    const client = await this.clientAuthenticationHandler.authenticate(request);
    const grantType = this.getGrantType(parameters, client);

    const context = <TContext>{ parameters, client, grantType };

    this.logger.debug(
      `[${this.constructor.name}] Token Request validation completed`,
      'c67f3504-c55b-426b-af08-b7f048e025ee',
      { context },
    );

    return context;
  }

  /**
   * Retrieves the Grant Type requested by the Client.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Grant Type.
   */
  private getGrantType(parameters: TokenRequest, client: Client): GrantTypeInterface {
    this.logger.debug(`[${this.constructor.name}] Called getGrantType()`, '78e5a934-1a5a-4123-9cba-25397bc90ffe', {
      parameters,
      client,
    });

    const grantType = this.grantTypes.find((grantType) => grantType.name === parameters.grant_type)!;

    if (!client.grantTypes.includes(grantType.name)) {
      const exc = new UnauthorizedClientException(
        `This Client is not allowed to request the grant_type "${grantType.name}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] This Client is not allowed to request the grant_type "${grantType.name}"`,
        'dba5311f-567f-4934-bd2b-8ae387783cb7',
        { grant_type: grantType.name, client },
        exc,
      );

      throw exc;
    }

    return grantType;
  }
}
