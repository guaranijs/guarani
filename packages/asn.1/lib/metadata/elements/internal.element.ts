import { Constructor, Optional } from '@guarani/types';

import { Node } from '../../nodes/node';
import { NodeOptions } from '../../nodes/node.options';
import { Type } from '../../type';

/**
 * Element used to define the Metadata of an Internal Element.
 */
export interface InternalElement {
  /**
   * Type Identifier of the Internal Element.
   */
  readonly type: Type;

  /**
   * ASN.1 Type Node Constructor to be used by the Internal Element.
   */
  readonly NodeConstructor: Constructor<Node>;

  /**
   * Optional attributes of the Node of the Internal Element.
   */
  readonly options?: Optional<NodeOptions>;

  /**
   * Name of the decorated property.
   */
  readonly propertyKey: string | symbol;

  /**
   * Model Type of the property.
   */
  readonly Model?: Optional<Constructor<object>>;
}
