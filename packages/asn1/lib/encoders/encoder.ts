import { InternalNodeElement } from '../metadata/elements/internal-node.element';
import { RootNodeElement } from '../metadata/elements/root-node.element';
import { getInternalNodeElements, getRootNodeElement, getTransformers } from '../metadata/helpers';
import { Node } from '../nodes/node';

export abstract class Encoder<T> {
  /**
   * Root Node to be encoded.
   */
  protected readonly node: Node;

  /**
   * Instantiates a new ASN.1 Encoder for the provided data.
   *
   * @param data Data to be encoded.
   */
  public constructor(data: object) {
    this.node = this.resolve(data);
  }

  /**
   * Checks if the provided data is a valid primitive type
   * in the context of ASN.1 Types.
   *
   * @param data Data to be checked.
   * @returns Check of whether the provided data is a primitive type.
   */
  protected static isPrimitive(data: unknown): boolean {
    return (
      data === null ||
      typeof data === 'bigint' ||
      typeof data === 'boolean' ||
      typeof data === 'string' ||
      Buffer.isBuffer(data) ||
      (Array.isArray(data) && data.every((item) => typeof item === 'number'))
    );
  }

  /**
   * Resolves the provided primitive data into a Node instance.
   *
   * @param data Primitive data to be resolved.
   * @param element Internal Node Element representing the primitive's metadata.
   * @returns Resolved Node.
   */
  protected resolvePrimitive(data: object, element: InternalNodeElement): Node {
    let item = <object>Reflect.get(data, element.propertyKey);

    const transformers = getTransformers(data, element.propertyKey);

    if (typeof transformers !== 'undefined') {
      transformers
        .filter(({ operation }) => operation === 'encode')
        .forEach(({ transformer }) => (item = transformer(item)));
    }

    return new element.node(item, element.options);
  }

  /**
   * Resolves an Internal Node Element into a Node instance.
   *
   * @param data Data to be resolved.
   * @param element Internal Node Element representing a property of the data.
   * @returns Resolved Node.
   */
  protected abstract resolveInternalNodeElement(data: object, element: InternalNodeElement): Node;

  /**
   * Resolves a Root Node Element into a Node instance.
   *
   * @param childrenNodes Nodes to be wrapped.
   * @param element Root Node Element representing the Model.
   * @returns Resolved Node.
   */
  protected abstract resolveRootNodeElement(childrenNodes: Node[], element: RootNodeElement): Node;

  /**
   * Resolves an instance of a Model into a Node instance.
   *
   * @param data Instance of a Model to be resolved into a Node.
   * @returns Resolved Node.
   */
  protected resolve(data: object): Node {
    const rootElement = getRootNodeElement(data);
    const internalElements = getInternalNodeElements(data);

    const childrenNodes = internalElements.map((element) => {
      return this.resolveInternalNodeElement(data, element);
    });

    return this.resolveRootNodeElement(childrenNodes, rootElement);
  }

  /**
   * Encodes the provided data.
   *
   * @returns Encoded data.
   */
  public abstract encode(): T;
}
