import { Constructor, Dict, Optional } from '@guarani/types';

import { EncodingException } from '../exceptions/encoding.exception';
import { InternalElement } from '../metadata/elements/internal.element';
import { RootElement } from '../metadata/elements/root.element';
import { getInternalElements, getRootElement, getTransformer } from '../metadata/helpers';
import { Node } from '../nodes/node';
import { Type } from '../type';

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
   * Encodes a BitString Node.
   */
  protected abstract encodeBitString(node: Node): T;

  /**
   * Encodes a Boolean Node.
   */
  protected abstract encodeBoolean(node: Node): T;

  /**
   * Encodes an Integer Node.
   */
  protected abstract encodeInteger(node: Node): T;

  /**
   * Encodes a Null Node;
   */
  protected abstract encodeNull(node: Node): T;

  /**
   * Encodes an Object Identifier Node.
   */
  protected abstract encodeObjectIdentifier(node: Node): T;

  /**
   * Encodes an OctetString Node.
   */
  protected abstract encodeOctetString(node: Node): T;

  /**
   * Encodes a Sequence Node.
   */
  protected abstract encodeSequence(node: Node): T;

  /**
   * Encodes the provided Node.
   *
   * @param node Node to be encoded.
   */
  protected abstract encodeNode(node: Node): T;

  /**
   * Checks if the provided data is a valid primitive type in the context of ASN.1 Types.
   *
   * @param data Data to be checked.
   */
  protected isPrimitiveASN1Type(data: unknown): boolean {
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
   * Resolves the provided Root Element into its respective Node.
   *
   * @param childrenNodes Children Nodes used as attributes of the Structured ASN.1 Type.
   * @param element Root Element to be inspected.
   * @returns Node representation of the Root Element.
   */
  private resolveRootElement(childrenNodes: Node[], element: RootElement): Node {
    const { NodeConstructor, type, options } = element;

    if (type !== Type.Sequence) {
      throw new EncodingException('A Root Element MUST be a Sequence Type.');
    }

    return new NodeConstructor(childrenNodes, options);
  }

  /**
   * Resolved the provided Internal Element into its respective Node.
   *
   * @param attribute Model which has the provided Internal Element as one of its attributes.
   * @param element Internal Element to be resolved.
   * @returns Node representation of the Internal Element.
   */
  private resolveInternalElement(attribute: any, element: InternalElement): Node {
    const { type } = element;

    if (!this.isPrimitiveASN1Type(attribute) && type !== Type.Nested) {
      const resolvedProperty = this.resolveModel(attribute);
      attribute = this.encode(resolvedProperty);
    }

    return this.isPrimitiveASN1Type(attribute)
      ? this.resolvePrimitiveASN1Type(attribute, element)
      : this.resolveModel(attribute);
  }

  /**
   * Resolves the provided primitive data into its respective Node.
   *
   * @param item Primitive data to be resolved.
   * @param element Internal Element representing the primitive data's metadata.
   * @returns Node representation of the primitive data.
   */
  protected resolvePrimitiveASN1Type(item: any, element: InternalElement): Node {
    const { NodeConstructor, options } = element;
    return new NodeConstructor(item, options);
  }

  private isUntaggedNestedModel(data?: Optional<object>): boolean {
    if (data === undefined) {
      return false;
    }

    if (typeof data !== 'object' || data === null) {
      return false;
    }

    return getRootElement(data).type === Type.Nested;
  }

  private resolvedUntaggedNestedModel(model: object, element: InternalElement): Node {
    const { NodeConstructor, options, type } = element;

    const internalElements = getInternalElements(model);

    let reducerInitialValue: any;
    let concatenator: (previous: any, current: any) => any;

    switch (type) {
      case Type.BitString:
      case Type.OctetString:
        reducerInitialValue = '';
        concatenator = (result: string, current: string): string => (result += current);
        break;

      default: {
        const type = NodeConstructor.name.substring(0, NodeConstructor.name.length - 4);
        throw new EncodingException(`A "${type}" cannot be used as a Nested Type.`);
      }
    }

    const data = internalElements.reduce((result, element) => {
      let data = Reflect.get(model, element.propertyKey);
      getTransformer(model, element.propertyKey)?.beforeEncode.forEach((fn) => (data = fn(data)));
      return concatenator(result, data);
    }, reducerInitialValue);

    return new NodeConstructor(data, options);
  }

  protected resolveModel(model: object): Node {
    const rootElement = getRootElement(model);
    const internalElements = getInternalElements(model);

    const childrenNodes: Node[] = internalElements.map((element) => {
      let childAttribute = Reflect.get(model, element.propertyKey);

      getTransformer(model, element.propertyKey)?.beforeEncode.forEach((fn) => (childAttribute = fn(childAttribute)));

      return this.isUntaggedNestedModel(childAttribute)
        ? this.resolvedUntaggedNestedModel(childAttribute, element)
        : this.resolveInternalElement(childAttribute, element);
    });

    return this.resolveRootElement(childrenNodes, rootElement);
  }

  /**
   * Encodes the data of the provided Node.
   *
   * @param node Node to be encoded.
   */
  public encode(node: Node): T;

  /**
   * Encodes the data of the provided model.
   *
   * @param model Object to be encoded.
   */
  public encode(model: object): T;

  /**
   * Encodes the provided data.
   *
   * @param modelOrNode Object or Node to be encoded.
   */
  public encode(modelOrNode: object | Node): T {
    const node = modelOrNode instanceof Node ? modelOrNode : this.resolveModel(modelOrNode);
    return this.encodeNode(node);
  }
}
