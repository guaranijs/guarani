import { Asn1Class } from '../types/asn1-class.type';
import { Asn1Encoding } from '../types/asn1-encoding.type';
import { Asn1Type } from '../types/asn1-type.type';
import { NodeOptions } from './node.options';

/**
 * Base class representing a Node in the ASN.1 Syntax Tree.
 *
 * This is an abstract class instead of an interface for the sole reason that, sometimes, we need to verify
 * if the data received by an entity is a subclass of Node or an unrelated type.
 *
 * You can find more information about the ASN.1 Types at the note
 * {@link https://homepages.dcc.ufmg.br/~coelho/nm/asn.1.intro.pdf A Layman's Guide to a Subset of ASN.1, BER, and DER},
 * which was used as the starting point for this implementation.
 */
export abstract class Node<T = unknown> {
  /**
   * Type Identifier of the Node.
   */
  public abstract readonly type: Asn1Type;

  /**
   * Data represented by the Node.
   */
  public readonly data: T;

  /**
   * Encoding of the Node.
   */
  public readonly encoding: Asn1Encoding;

  /**
   * Class of the Node.
   */
  public readonly class: Asn1Class;

  /**
   * Explicit Tag Identifier of the Node.
   */
  public readonly explicit?: number;

  /**
   * Implicit Tag Identifier of the Node.
   */
  public readonly implicit?: number;

  /**
   * Internal constructor of the Node.
   *
   * @param data Data represented by the Node.
   * @param options Parameters to customize the Node.
   */
  public constructor(data: T, options: NodeOptions) {
    // Checks that at most one Tagging method is provided.
    if (typeof options.explicit !== 'undefined' && typeof options.implicit !== 'undefined') {
      throw new Error('A Node cannot have both EXPLICIT and IMPLICIT Tags.');
    }

    // Makes sure that a Universal Type is not Tagged.
    if (
      (typeof options.explicit !== 'undefined' || typeof options.implicit !== 'undefined') &&
      options.class === 'universal'
    ) {
      throw new Error('No Universal Class Tag allowed when tagging.');
    }

    // Makes sure that a Tag Class has to have a Tagging method.
    if (
      typeof options.explicit === 'undefined' &&
      typeof options.implicit === 'undefined' &&
      options.class !== 'universal'
    ) {
      throw new Error('A Tagged Type must have an EXPLICIT or IMPLICIT Tag.');
    }

    // TODO: Add check of tag value to be at most 0x7f?
    this.data = data;
    this.encoding = options.encoding!;
    this.class = options.class ?? 'universal';
    this.explicit = options.explicit;
    this.implicit = options.implicit;
  }
}
