import { Constructor, Dict } from '@guarani/types';

import { EncodingException } from '../exceptions/encoding.exception';
import { Node } from '../nodes/node';
import { Type } from '../type';

/**
 * Base ASN.1 Encoder class.
 */
export abstract class Encoder<T> {
  /**
   * Dictionary containing the supported encoder methods.
   */
  protected readonly encoders: Dict<(node: Node) => T> = {
    [String(Type.BitString)]: this.encodeBitString,
    [String(Type.Boolean)]: this.encodeBoolean,
    [String(Type.Integer)]: this.encodeInteger,
    [String(Type.Null)]: this.encodeNull,
    [String(Type.ObjectIdentifier)]: this.encodeObjectIdentifier,
    [String(Type.OctetString)]: this.encodeOctetString,
    [String(Type.Sequence)]: this.encodeSequence,
  };

  /**
   * Ensures that the provided Node is an instance of the provided Node Constructor.
   * @param node Node to be inspected.
   * @param NodeConstructor Expected Node Constructor.
   */
  protected ensureNodeInstance<TNode extends Node>(node: Node, NodeConstructor: Constructor<TNode>): void {
    if (!(node instanceof NodeConstructor)) {
      throw new EncodingException(`The provided Node is not an instance of "${NodeConstructor.name}".`);
    }
  }

  /**
   * Encodes a Bit String Node.
   *
   * @param node Bit String Node to be encoded.
   * @returns Encoded Bit String.
   */
  protected abstract encodeBitString(node: Node): T;

  /**
   * Encodes a Boolean Node.
   *
   * @param node Boolean Node to be encoded.
   * @returns Encoded Boolean.
   */
  protected abstract encodeBoolean(node: Node): T;

  /**
   * Encodes an Integer Node.
   *
   * @param node Integer Node to be encoded.
   * @returns Encoded Integer.
   */
  protected abstract encodeInteger(node: Node): T;

  /**
   * Encodes a Null Node.
   *
   * @param node Null Node to be encoded.
   * @returns Encoded Null.
   */
  protected abstract encodeNull(node: Node): T;

  /**
   * Encodes an Object Identifier Node.
   *
   * @param node Object Identifier Node to be encoded.
   * @returns Encoded Object Identifier.
   */
  protected abstract encodeObjectIdentifier(node: Node): T;

  /**
   * Encodes an Octet String Node.
   *
   * @param node Octet String Node to be encoded.
   * @returns Encoded Octet String.
   */
  protected abstract encodeOctetString(node: Node): T;

  /**
   * Encodes a Sequence Node.
   *
   * @param node Sequence Node to be encoded.
   * @returns Encoded Sequence.
   */
  protected abstract encodeSequence(node: Node): T;

  /**
   * Encodes the provided Node.
   *
   * @param node Node to be encoded.
   * @returns Encoded Node.
   */
  public abstract encode(node: Node): T;
}
