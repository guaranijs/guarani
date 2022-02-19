import { Constructor, Optional } from '@guarani/types';

import { Node } from '../../nodes/node';
import { NodeOptions } from '../../nodes/node.options';
import { Type } from '../../type';

/**
 * Element used to define the Metadata of an Internal Node.
 */
export interface InternalNodeElement {
  /**
   * Type Identifier of the Internal Node Element.
   */
  readonly type: Type;

  /**
   * ASN.1 Type Node to be used by the Internal Node Element.
   */
  readonly node: Constructor<Node>;

  /**
   * Optional attributes of the Node of the Internal Node Element.
   */
  readonly options?: Optional<NodeOptions>;

  /**
   * Name of the decorated property.
   */
  readonly propertyKey: string | symbol;

  /**
   * Model Type of the property.
   */
  readonly model?: Optional<Constructor<object>>;

  /**
   * Number of bytes to be parsed into a Bytes decorated property.
   */
  readonly bytesLength?: Optional<number>;
}
