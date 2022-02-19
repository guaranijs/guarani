import { Optional } from '@guarani/types';

import { AbstractGraph } from './abstract-graph';
import { Edge, EdgeOptions } from './edge';

/**
 * Implementation of an Undirected Graph.
 */
export class Graph<V, E = unknown> extends AbstractGraph<V, E> {
  /**
   * Deletes the provided Vertex and its Edges from the Graph.
   *
   * @param vertex Vertex to be deleted from the Graph.
   */
  public deleteVertex(vertex: V): boolean {
    if (!this.hasVertex(vertex)) {
      return false;
    }

    for (const edge of this.edges(vertex)) {
      this.deleteEdge(edge.source, edge.target);
    }

    this.graph.delete(vertex);
    this._vertexCount -= 1;

    return true;
  }

  /**
   * Creates an Edge between the provided Vertices.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   * @param options Optional parameters of the Edge.
   */
  public addEdge(source: V, target: V, options?: Optional<EdgeOptions<E>>): void {
    if (!this.hasVertex(source)) {
      this.addVertex(source);
    }

    if (!this.hasVertex(target)) {
      this.addVertex(target);
    }

    const outgoingEdge = new Edge<V, E>(source, target, options);
    const incomingEdge = new Edge<V, E>(target, source, options);

    this.graph.get(source)!.add(outgoingEdge);
    this.graph.get(target)!.add(incomingEdge);

    this._edgeCount += 2;
  }

  /**
   * Defines the Item represented by the Edge.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   * @param item Item to be represented by the Edge.
   * @returns Whether or not the Edge's Item has been set.
   */
  public setEdgeItem(source: V, target: V, item: E): boolean {
    const outgoingEdge = this.getEdge(source, target);
    const incomingEdge = this.getEdge(target, source);

    if (outgoingEdge === null || incomingEdge === null) {
      return false;
    }

    outgoingEdge.item = item;
    incomingEdge.item = item;

    return true;
  }

  /**
   * Defines the Weight of the Edge.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   * @param weight Weight of the Edge.
   * @returns Whether or not the Edge's Weight has been set.
   */
  public setEdgeWeight(source: V, target: V, weight: number): boolean {
    const outgoingEdge = this.getEdge(source, target);
    const incomingEdge = this.getEdge(target, source);

    if (outgoingEdge === null || incomingEdge === null) {
      return false;
    }

    outgoingEdge.weight = weight;
    incomingEdge.weight = weight;

    return true;
  }

  /**
   * Deletes the Edge that connects the provided Vertices from the Graph.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   */
  public deleteEdge(source: V, target: V): boolean {
    if (!this.hasVertex(source) || !this.hasVertex(target)) {
      return false;
    }

    if (!this.hasEdge(source, target)) {
      return false;
    }

    const outgoingEdge = this.getEdge(source, target)!;
    const incomingEdge = this.getEdge(target, source)!;

    this.graph.get(source)!.delete(outgoingEdge);
    this.graph.get(target)!.delete(incomingEdge);

    this._edgeCount -= 2;

    return true;
  }
}
