import { Nullable, Optional } from '@guarani/types';

import { AbstractSet } from '../sets/abstract-set';
import { OrderedSet } from '../sets/ordered-set';
import { Edge, EdgeOptions } from './edge';

/**
 * Abstract Base Class of the Abstract Graph.
 */
export abstract class AbstractGraph<V, E = unknown> {
  /**
   * Number of Vertices currently in the Graph.
   */
  protected _vertexCount = 0;

  /**
   * Number of Edges currently in the Graph.
   */
  protected _edgeCount = 0;

  /**
   * Mapping of the Vertices and their respective Adjacency Sets.
   */
  protected readonly graph = new Map<V, AbstractSet<Edge<V, E>>>();

  /**
   * Number of Vertices currently in the Graph.
   */
  public get vertexCount(): number {
    return this._vertexCount;
  }

  /**
   * Number of Edges currently in the Graph.
   */
  public get edgeCount(): number {
    return this._edgeCount;
  }

  /**
   * Checks if the provided Vertex is present in the Graph.
   *
   * @param vertex Vertex to be checked.
   */
  public hasVertex(vertex: V): boolean {
    return this.graph.has(vertex);
  }

  /**
   * Adds the provided Item as a Vertex of the Graph.
   *
   * @param vertex Item to be added as a Vertex of the Graph.
   */
  public addVertex(vertex: V): void {
    if (this.hasVertex(vertex)) {
      return;
    }

    this.graph.set(vertex, new OrderedSet<Edge<V, E>>());
    this._vertexCount += 1;
  }

  /**
   * Deletes the provided Vertex and its Edges from the Graph.
   *
   * @param vertex Vertex to be deleted from the Graph.
   */
  public abstract deleteVertex(vertex: V): boolean;

  /**
   * Checks if there is an Edge between the provided Vertices in the Graph.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   */
  public hasEdge(source: V, target: V): boolean {
    return this.getEdge(source, target) !== null;
  }

  /**
   * Creates an Edge between the provided Vertices.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   * @param options Optional parameters of the Edge.
   */
  public abstract addEdge(source: V, target: V, options?: Optional<EdgeOptions<E>>): void;

  /**
   * Returns the Edge object that connects the provided Vertices.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   */
  public getEdge(source: V, target: V): Nullable<Edge<V, E>> {
    return this.outgoingEdges(source).find((edge) => edge.target === target) ?? null;
  }

  /**
   * Defines the Item represented by the Edge.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   * @param item Item to be represented by the Edge.
   * @returns Whether or not the Edge's Item has been set.
   */
  public abstract setEdgeItem(source: V, target: V, item: E): boolean;

  /**
   * Defines the Weight of the Edge.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   * @param weight Weight of the Edge.
   * @returns Whether or not the Edge's Weight has been set.
   */
  public abstract setEdgeWeight(source: V, target: V, weight: number): boolean;

  /**
   * Deletes the Edge that connects the provided Vertices from the Graph.
   *
   * @param source Source Vertex of the Edge.
   * @param target Target Vertex of the Edge.
   */
  public abstract deleteEdge(source: V, target: V): boolean;

  /**
   * Returns the Incoming Edges associated with the provided Vertex.
   *
   * An Incoming Edge is an Edge that starts at an arbitrary Vertex
   * and has the provided Vertex as its target.
   *
   * @param vertex Vertex to be checked.
   */
  public incomingEdges(vertex: V): AbstractSet<Edge<V, E>> {
    const neighbours = new OrderedSet<Edge<V, E>>();

    if (!this.hasVertex(vertex)) {
      return neighbours;
    }

    for (const edges of this.graph.values()) {
      const edge = edges.find((edge) => edge.target === vertex);

      if (edge !== null) {
        neighbours.add(edge);
      }
    }

    return neighbours;
  }

  /**
   * Returns the Outgoing Edges associated with the provided Vertex.
   *
   * An Outgoing Edge is an Edge that starts at the provided Vertex
   * and has an arbitrary Vertex as its target.
   *
   * @param vertex Vertex to be checked.
   */
  public outgoingEdges(vertex: V): AbstractSet<Edge<V, E>> {
    return this.graph.get(vertex) ?? new OrderedSet<Edge<V, E>>();
  }

  /**
   * Returns the Edges associated with the provided Vertex.
   *
   * @param vertex Vertex to be checked.
   */
  public edges(vertex: V): AbstractSet<Edge<V, E>> {
    const incomingEdges = this.incomingEdges(vertex);
    const outgoingEdges = this.outgoingEdges(vertex);

    return incomingEdges.union(outgoingEdges);
  }

  /**
   * Returns a Set of the Incoming Neighbours of the provided Vertex.
   *
   * @param vertex Vertex to be checked.
   */
  public incomingNeighbours(vertex: V): AbstractSet<V> {
    return this.incomingEdges(vertex).map((edge) => edge.source) ?? new OrderedSet<V>();
  }

  /**
   * Returns a Set of the Outgoing Neighbours of the provided Vertex.
   *
   * @param vertex Vertex to be checked.
   */
  public outgoingNeighbours(vertex: V): AbstractSet<V> {
    return this.outgoingEdges(vertex).map((edge) => edge.target) ?? new OrderedSet<V>();
  }

  /**
   * Returns a Set of the Neighbours of the provided Vertex.
   *
   * @param vertex Vertex to be checked.
   */
  public neighbours(vertex: V): AbstractSet<V> {
    const incomingNeighbours = this.incomingNeighbours(vertex);
    const outgoingNeighbours = this.outgoingNeighbours(vertex);

    return incomingNeighbours.union(outgoingNeighbours);
  }

  /**
   * Returns the In-Degree of the provided Vertex.
   *
   * The In-Degree of a Vertex is the number of adjacent Vertices
   * that have itself as a Target Vertex.
   *
   * @param vertex Vertex to be checked.
   */
  public inDegree(vertex: V): number {
    return this.incomingEdges(vertex)?.length ?? 0;
  }

  /**
   * Returns the Out-Degree of the provided Vertex.
   *
   * The Out-Degree of a Vertex is the number of adjacent Vertices
   * that are reachable from itself.
   *
   * @param vertex Vertex to be checked.
   */
  public outDegree(vertex: V): number {
    return this.outgoingEdges(vertex)?.length ?? 0;
  }

  /**
   * Returns the Degree of the provided Vertex.
   *
   * The Degree of a Vertex is the number of Vertices that are adjacent
   * to itself.
   *
   * @param vertex Vertex to be checked.
   */
  public degree(vertex: V): number {
    return this.inDegree(vertex) + this.outDegree(vertex);
  }
}
