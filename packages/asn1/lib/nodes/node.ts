/**
 * Base class representing a node in the ASN.1 Syntax Tree.
 *
 * The only required method for subclasses is the encode() method,
 * that is used to convert the data supported by the node into a
 * buffer recognizable by the Syntax Tree.
 *
 * This is an abstract class rather than an interface for the sole
 * reason that we sometimes need to verify if the data received by
 * an entity is a subclass of Node or an unrelated type.
 *
 * You can find more information about the ASN.1 Types at the note
 * {@link https://homepages.dcc.ufmg.br/~coelho/nm/asn.1.intro.pdf|A Layman's Guide to a Subset of ASN.1, BER, and DER},
 * which was used as the starting point for this implementation.
 */
export abstract class Node {
  /**
   * Encodes the data of the Node into an array based on the specs
   * of the ASN.1 Protocol.
   *
   * @returns Encoded data based on the respective ASN.1 type.
   *
   * @example
   * const node = new Integer(131580)
   * node.encode() // <Buffer 02 03 02 01 fc>
   */
  public abstract encode(): Buffer
}
