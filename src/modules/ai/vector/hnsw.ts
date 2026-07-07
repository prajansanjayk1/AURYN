import { Vector } from '../types';
import { VectorEngine } from '../embeddings/engine';

interface HNSWNode {
  id: string;
  vector: Vector;
  connections: Set<string>;
  metadata?: Record<string, any>;
}

export class LocalHNSWIndex {
  private nodes: Map<string, HNSWNode> = new Map();
  private maxConnections = 4; // M parameter
  private entryPointId: string | null = null;

  /**
   * Clears the index.
   */
  public clear(): void {
    this.nodes.clear();
    this.entryPointId = null;
  }

  /**
   * Adds a vector to the Navigable Small World graph.
   */
  public addPoint(id: string, vector: Vector, metadata?: Record<string, any>): void {
    if (this.nodes.has(id)) {
      this.removePoint(id);
    }

    const newNode: HNSWNode = {
      id,
      vector,
      connections: new Set<string>(),
      metadata
    };

    this.nodes.set(id, newNode);

    if (!this.entryPointId) {
      this.entryPointId = id;
      return;
    }

    // Find nearest neighbors to connect
    const nearest = this.searchBase(vector, this.maxConnections);
    
    nearest.forEach(neighborId => {
      const neighbor = this.nodes.get(neighborId);
      if (neighbor) {
        newNode.connections.add(neighborId);
        neighbor.connections.add(id);

        // Keep connections capped
        if (neighbor.connections.size > this.maxConnections) {
          this.shrinkConnections(neighbor);
        }
      }
    });

    if (newNode.connections.size > this.maxConnections) {
      this.shrinkConnections(newNode);
    }
  }

  /**
   * Removes a point from the graph.
   */
  public removePoint(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    node.connections.forEach(connId => {
      const connNode = this.nodes.get(connId);
      if (connNode) {
        connNode.connections.delete(id);
        
        // Re-route links to keep graph connected
        node.connections.forEach(siblingId => {
          if (siblingId !== connId) {
            connNode.connections.add(siblingId);
          }
        });
      }
    });

    this.nodes.delete(id);
    if (this.entryPointId === id) {
      this.entryPointId = this.nodes.keys().next().value || null;
    }
  }

  /**
   * Reduces node connections to the closest neighbors.
   */
  private shrinkConnections(node: HNSWNode): void {
    const sorted = Array.from(node.connections)
      .map(connId => ({
        id: connId,
        dist: VectorEngine.euclideanDistance(node.vector, this.nodes.get(connId)!.vector)
      }))
      .sort((a, b) => a.dist - b.dist);

    node.connections = new Set(sorted.slice(0, this.maxConnections).map(s => s.id));
  }

  /**
   * Greedy routing search on the graph to find the nearest point.
   */
  private searchNearestNode(query: Vector): HNSWNode {
    let currNode = this.nodes.get(this.entryPointId!)!;
    let currDist = VectorEngine.euclideanDistance(query, currNode.vector);
    let changed = true;

    while (changed) {
      changed = false;
      for (const neighborId of currNode.connections) {
        const neighbor = this.nodes.get(neighborId)!;
        const dist = VectorEngine.euclideanDistance(query, neighbor.vector);
        if (dist < currDist) {
          currDist = dist;
          currNode = neighbor;
          changed = true;
        }
      }
    }

    return currNode;
  }

  /**
   * Performs an approximate search for top N elements.
   */
  private searchBase(query: Vector, topK: number): string[] {
    if (!this.entryPointId) return [];

    const nearestNode = this.searchNearestNode(query);
    const visited = new Set<string>([nearestNode.id]);
    
    // Priority queue of candidates (sorted by distance ascending)
    const candidates = [{ id: nearestNode.id, dist: VectorEngine.euclideanDistance(query, nearestNode.vector) }];
    const results = [...candidates];

    while (candidates.length > 0) {
      const curr = candidates.shift()!;
      
      const currNode = this.nodes.get(curr.id)!;
      for (const neighborId of currNode.connections) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const neighbor = this.nodes.get(neighborId)!;
          const dist = VectorEngine.euclideanDistance(query, neighbor.vector);
          
          if (results.length < topK || dist < results[results.length - 1].dist) {
            candidates.push({ id: neighborId, dist });
            results.push({ id: neighborId, dist });
            results.sort((a, b) => a.dist - b.dist);
            if (results.length > topK * 2) {
              results.pop();
            }
          }
        }
      }
      candidates.sort((a, b) => a.dist - b.dist);
    }

    return results.slice(0, topK).map(r => r.id);
  }

  /**
   * Advanced Top K search with cosine similarity scoring, weight adjustments, and metadata filters.
   */
  public search(
    query: Vector,
    topK: number,
    filter?: (metadata: any) => boolean,
    weights?: Vector
  ): Array<{ id: string; similarity: number; metadata?: Record<string, any> }> {
    if (this.nodes.size === 0) return [];

    // Retrieve a larger candidate set to ensure recall after filtering
    const candidates = this.searchBase(query, Math.max(topK * 3, 10));

    const queryVec = weights 
      ? query.map((v, i) => v * (weights[i] !== undefined ? weights[i] : 1))
      : query;

    const list = candidates
      .map(id => {
        const node = this.nodes.get(id)!;
        const nodeVec = weights
          ? node.vector.map((v, i) => v * (weights[i] !== undefined ? weights[i] : 1))
          : node.vector;

        const similarity = VectorEngine.cosineSimilarity(queryVec, nodeVec);
        return {
          id,
          similarity,
          metadata: node.metadata
        };
      })
      .filter(item => {
        if (!filter) return true;
        return filter(item.metadata);
      });

    return list
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Searches for vectors within a given distance radius.
   */
  public searchRadius(
    query: Vector,
    radius: number,
    filter?: (metadata: any) => boolean
  ): Array<{ id: string; distance: number; metadata?: Record<string, any> }> {
    const results: Array<{ id: string; distance: number; metadata?: Record<string, any> }> = [];

    this.nodes.forEach(node => {
      const dist = VectorEngine.euclideanDistance(query, node.vector);
      if (dist <= radius) {
        if (!filter || filter(node.metadata)) {
          results.push({
            id: node.id,
            distance: dist,
            metadata: node.metadata
          });
        }
      }
    });

    return results.sort((a, b) => a.distance - b.distance);
  }
}
