import { Constructor, Optional } from '@guarani/types';

import { Node } from '../../nodes/node';
import { NodeOptions } from '../../nodes/node.options';
import { Type } from '../../type';

/**
 * Element used to define the Metadata of a Root Node.
 */
export interface RootNodeElement {
  /**
   * Type Identifier of the Root Node Element.
   */
  readonly type: Type;

  /**
   * ASN.1 Type Node to be used by the Root Node Element.
   */
  readonly node: Constructor<Node>;

  /**
   * Optional attributes of the Node of the Root Node Element.
   */
  readonly options?: Optional<NodeOptions>;
}
