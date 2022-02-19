import { Constructor, Optional } from '@guarani/types';

import { Node } from '../../nodes/node';
import { NodeOptions } from '../../nodes/node.options';
import { Type } from '../../type';

/**
 * Element used to define the Metadata of a Root Element.
 */
export interface RootElement {
  /**
   * Type Identifier of the Root Element.
   */
  readonly type: Type;

  /**
   * ASN.1 Type Node Constructor to be used by the Root Element.
   */
  readonly NodeConstructor: Constructor<Node>;

  /**
   * Optional attributes of the Node of the Root Element.
   */
  readonly options?: Optional<NodeOptions>;
}
