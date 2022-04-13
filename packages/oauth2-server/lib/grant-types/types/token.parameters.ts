import { SupportedGrantType } from './supported-grant-type';

/**
 * Defines the default parameters of the Token Request.
 */
export interface TokenParameters {
  /**
   * Grant Type requested by the Client.
   */
  readonly grant_type: SupportedGrantType;

  /**
   * Optional additional Parameters.
   */
  readonly [parameter: string]: any;
}
