import { integerToBuffer } from '@guarani/primitives';
import { Optional } from '@guarani/types';

import { Class } from '../class';
import { encodeLength } from '../length';
import { Method } from '../method';
import { Type } from '../type';
import { NodeOptions } from './node.options';

/**
 * Base class representing a Node in the ASN.1 Syntax Tree.
 *
 * The only required method for subclasses is the `encodeData()` method,
 * that is used to convert the data supported by the Node into a
 * buffer recognizable by the Syntax Tree.
 *
 * This is an abstract class instead of an interface for the sole
 * reason that, sometimes, we need to verify if the data received by
 * an entity is a subclass of Node or an unrelated type.
 *
 * You can find more information about the ASN.1 Types at the note
 * {@link https://homepages.dcc.ufmg.br/~coelho/nm/asn.1.intro.pdf A Layman's Guide to a Subset of ASN.1, BER, and DER},
 * which was used as the starting point for this implementation.
 */
export abstract class Node<T = unknown> {
  /**
   * Type Identifier of the Node.
   */
  protected static readonly type: Type;

  /**
   * Value represented by the Node.
   */
  public value: T;

  /**
   * Method of the Node.
   */
  protected readonly method: Method;

  /**
   * Class of the Node.
   */
  protected readonly class: Class;

  /**
   * Explicit Tag Identifier of the Node.
   */
  protected readonly explicit?: Optional<number>;

  /**
   * Implicit Tag Identifier of the Node.
   */
  protected readonly implicit?: Optional<number>;

  /**
   * Internal constructor of the Node.
   *
   * @param value Value represented by the Node.
   * @param options Parameters to customize the Node.
   */
  protected constructor(value: T, options: NodeOptions) {
    const { class: class_, explicit, implicit, method } = options;

    // Checks that at most one Tagging method is provided.
    if (typeof explicit !== 'undefined' && typeof implicit !== 'undefined') {
      throw new Error('A Node cannot have both EXPLICIT and IMPLICIT Tags.');
    }

    // Makes sure that a Universal Type is not Tagged.
    if ((typeof explicit !== 'undefined' || typeof implicit !== 'undefined') && class_ === Class.Universal) {
      throw new Error('No Universal Tag Class allowed.');
    }

    // Makes sure that a Tag Class has to have a Tagging method.
    if (typeof explicit === 'undefined' && typeof implicit === 'undefined' && class_ !== Class.Universal) {
      throw new Error('A Tagged Type must have an EXPLICIT or IMPLICIT Tag.');
    }

    // TODO: Add check of tag value to be at most 0x7f?

    this.value = value;
    this.method = method!;
    this.class = class_ ?? Class.Universal;
    this.explicit = explicit;
    this.implicit = implicit;
  }

  /**
   * Checks whether the provided buffer's Type Identifier matches the Node's one.
   *
   * @param buffer Buffer to be checked.
   * @returns Whether or not the buffer is a BitString.
   */
  public static checkType(buffer: Buffer): boolean {
    return (buffer[0] & 0x1f) === this.type;
  }

  /**
   * Encodes the Node into a Buffer object containing the untagged
   * or implicitly tagged ASN.1 Type.
   *
   * @returns Encoded non-explicit Node data.
   */
  private encodeNode(): Buffer {
    const value = this.encodeData();
    const length = encodeLength(value.length);

    // Explicit Tagging uses the raw Type.
    let { type } = <typeof Node>this.constructor;

    // Implicit Tagging.
    if (typeof this.implicit !== 'undefined') {
      type = this.class | Method.Primitive | this.implicit;
    }

    // No Tagging.
    else if (typeof this.explicit === 'undefined') {
      type = this.method | type;
    }

    const encodedType = integerToBuffer(type);

    return Buffer.concat([encodedType, length, value]);
  }

  /**
   * Encodes the value of the Node into a Buffer based on the specs
   * of the ASN.1 Protocol.
   *
   * @returns Encoded value based on the respective ASN.1 type.
   *
   * @example
   * const node = new IntegerNode(131580)
   * node.encode() // <Buffer 02 03 02 01 fc>
   */
  protected abstract encodeData(): Buffer;

  /**
   * Encodes the data of the Node into a TLV Buffer object containing
   * the (Tagged) ASN.1 Type, the length of the value and the value itself.
   *
   * @returns Encoded data of the Node.
   */
  public encode(): Buffer {
    const encodedNode = this.encodeNode();

    if (typeof this.explicit !== 'undefined') {
      const tag = this.class | Method.Constructed | this.explicit;

      const taggedLength = encodeLength(encodedNode.length);
      const encodedTag = integerToBuffer(tag);

      return Buffer.concat([encodedTag, taggedLength, encodedNode]);
    }

    return encodedNode;
  }
}
