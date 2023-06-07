import { Constructor } from '@guarani/types';

import { DisplayInterface } from './display.interface';
import { Display } from './display.type';
import { PageDisplay } from './page.display';
import { PopupDisplay } from './popup.display';
import { TouchDisplay } from './touch.display';
import { WapDisplay } from './wap.display';

/**
 * Display Registry.
 */
export const displayRegistry: Record<Display, Constructor<DisplayInterface>> = {
  page: PageDisplay,
  popup: PopupDisplay,
  touch: TouchDisplay,
  wap: WapDisplay,
};
