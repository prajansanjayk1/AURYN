import { MenuItem } from '../types';

export interface RankingWeights {
  semantic: number;
  preference: number;
  context: number;
  knowledgeGraph: number;
  popularity: number;
  recentOrders: number;
  availability: number;
}

export class RankingEngine {
  private static weights: RankingWeights = {
    semantic: 0.30,
    preference: 0.20,
    context: 0.15,
    knowledgeGraph: 0.10,
    popularity: 0.10,
    recentOrders: 0.10,
    availability: 0.05
  };

  /**
   * Updates scoring weights dynamically
   */
  public static configureWeights(newWeights: Partial<RankingWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
  }

  /**
   * Returns current active weights
   */
  public static getWeights(): RankingWeights {
    return this.weights;
  }

  /**
   * Computes a unified mathematical ranking score for a MenuItem.
   */
  public static computeScore(components: {
    semantic: number;
    preference: number;
    context: number;
    knowledgeGraph: number;
    popularity: number;
    recentOrders: number;
    availability: number;
  }): number {
    const w = this.weights;
    return (
      (w.semantic * components.semantic) +
      (w.preference * components.preference) +
      (w.context * components.context) +
      (w.knowledgeGraph * components.knowledgeGraph) +
      (w.popularity * components.popularity) +
      (w.recentOrders * components.recentOrders) +
      (w.availability * components.availability)
    );
  }
}
