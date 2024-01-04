import { Constructor } from '@guarani/types';

import { SerializationException } from '../exceptions/serialization.exception';
import { Node } from '../nodes/node';
import { Asn1Type } from '../types/asn1-type.type';

/**
 * Base ASN.1 Serializer class.
 */
export abstract class Asn1Serializer<T> {
  /**
   * Dictionary containing the supported serializers.
   */
  protected readonly serializers: Record<Asn1Type, (node: Node) => T> = {
    bitstring: this.bitstring,
    boolean: this.boolean,
    integer: this.integer,
    null: this.null,
    objectidentifier: this.objectidentifier,
    octetstring: this.octetstring,
    sequence: this.sequence,
  };

  /**
   * Ensures that the provided Node is an instance of the provided Node Constructor.
   *
   * @param node Node to be inspected.
   * @param nodeConstructor Expected Node Constructor.
   */
  protected ensureNodeInstance<TNode extends Node>(node: Node, nodeConstructor: Constructor<TNode>): void {
    if (!(node instanceof nodeConstructor)) {
      throw new SerializationException(`The provided Node is not an instance of "${nodeConstructor.name}".`);
    }
  }

  /**
   * Serializes a Bit String Node.
   *
   * @param node Bit String Node to be serialized.
   * @returns Serialized Bit String.
   */
  protected abstract bitstring(node: Node): T;

  /**
   * Serializes a Boolean Node.
   *
   * @param node Boolean Node to be serialized.
   * @returns Serialized Boolean.
   */
  protected abstract boolean(node: Node): T;

  /**
   * Serializes an Integer Node.
   *
   * @param node Integer Node to be serialized.
   * @returns Serialized Integer.
   */
  protected abstract integer(node: Node): T;

  /**
   * Serializes a Null Node.
   *
   * @param node Null Node to be serialized.
   * @returns Serialized Null.
   */
  protected abstract null(node: Node): T;

  /**
   * Serializes an Object Identifier Node.
   *
   * @param node Object Identifier Node to be serialized.
   * @returns Serialized Object Identifier.
   */
  protected abstract objectidentifier(node: Node): T;

  /**
   * Serializes an Octet String Node.
   *
   * @param node Octet String Node to be serialized.
   * @returns Serialized Octet String.
   */
  protected abstract octetstring(node: Node): T;

  /**
   * Serializes a Sequence Node.
   *
   * @param node Sequence Node to be serialized.
   * @returns Serialized Sequence.
   */
  protected abstract sequence(node: Node): T;

  /**
   * Serializes the provided Node.
   *
   * @param node Node to be serialized.
   * @returns Serialized Node.
   */
  public abstract encode(node: Node): T;
}
