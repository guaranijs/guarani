import { Injectable } from '@guarani/di';

import { DisplayInterface } from './display.interface';
import { Display } from './display.type';
import { PageDisplay } from './page.display';

@Injectable()
export class WapDisplay extends PageDisplay implements DisplayInterface {
  /**
   * Name of the Display.
   */
  public override readonly name: Display = 'wap';
}
