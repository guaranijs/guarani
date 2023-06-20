import { TokenContext } from '../../context/token/token-context';
import { Client } from '../../entities/client.entity';
import { UnauthorizedClientException } from '../../exceptions/unauthorized-client.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { HttpRequest } from '../../http/http.request';
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
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    protected readonly grantTypes: GrantTypeInterface[]
  ) {}

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public async validate(request: HttpRequest): Promise<TContext> {
    const parameters = request.form<TokenRequest>();

    const client = await this.clientAuthenticationHandler.authenticate(request);
    const grantType = this.getGrantType(parameters, client);

    return <TContext>{ parameters, client, grantType };
  }

  /**
   * Retrieves the Grant Type requested by the Client.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Grant Type.
   */
  private getGrantType(parameters: TokenRequest, client: Client): GrantTypeInterface {
    const grantType = this.grantTypes.find((grantType) => grantType.name === parameters.grant_type)!;

    if (!client.grantTypes.includes(grantType.name)) {
      throw new UnauthorizedClientException(
        `This Client is not allowed to request the grant_type "${grantType.name}".`
      );
    }

    return grantType;
  }
}
