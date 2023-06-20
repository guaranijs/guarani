import { Injectable } from '@guarani/di';

import { DisplayInterface } from './display.interface';
import { Display } from './display.type';
import { PageDisplay } from './page.display';

/**
 * Implementation of the **Touch** Display.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
@Injectable()
export class TouchDisplay extends PageDisplay implements DisplayInterface {
  /**
   * Name of the Display.
   */
  public override readonly name: Display = 'touch';
}
