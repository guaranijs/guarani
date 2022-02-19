import { Optional } from '@guarani/types';

import { Class } from '../class';
import { Encoding } from '../encoding';
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
  public abstract readonly type: Type;

  /**
   * Data represented by the Node.
   */
  public readonly data: T;

  /**
   * Encoding of the Node.
   */
  public readonly encoding: Encoding;

  /**
   * Class of the Node.
   */
  public readonly class: Class;

  /**
   * Explicit Tag Identifier of the Node.
   */
  public readonly explicit?: Optional<number>;

  /**
   * Implicit Tag Identifier of the Node.
   */
  public readonly implicit?: Optional<number>;

  /**
   * Internal constructor of the Node.
   *
   * @param data Data represented by the Node.
   * @param options Parameters to customize the Node.
   */
  public constructor(data: T, options: NodeOptions) {
    // Checks that at most one Tagging method is provided.
    if (options.explicit !== undefined && options.implicit !== undefined) {
      throw new Error('A Node cannot have both EXPLICIT and IMPLICIT Tags.');
    }

    // Makes sure that a Universal Type is not Tagged.
    if ((options.explicit !== undefined || options.implicit !== undefined) && options.class === Class.Universal) {
      throw new Error('No Universal Class Tag allowed when tagging.');
    }

    // Makes sure that a Tag Class has to have a Tagging method.
    if (options.explicit === undefined && options.implicit === undefined && options.class !== Class.Universal) {
      throw new Error('A Tagged Type must have an EXPLICIT or IMPLICIT Tag.');
    }

    // TODO: Add check of tag value to be at most 0x7f?

    this.data = data;
    this.encoding = options.encoding!;
    this.class = options.class ?? Class.Universal;
    this.explicit = options.explicit;
    this.implicit = options.implicit;
  }
}
